import {
  PrismaClient,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  BillStatus,
} from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

const prisma = globalPrisma;

export interface RecordPaymentData {
  referenceType: 'INVOICE' | 'BILL' | 'EXPENSE';
  referenceId: string;
  amount: number;
  currency?: string;
  paymentDate: Date;
  paymentMethod: string;
  transactionRef?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  upiId?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface ListPaymentFilters {
  paymentType?: string;
  referenceType?: string;
  partyType?: string;
  partyId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  paymentMethod?: string;
}

export class PaymentService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private async generatePaymentId(companyId: string): Promise<string> {
    const lastPayment = await this.prisma.payments.findFirst({
      where: { company_id: companyId },
      orderBy: { payment_id: 'desc' },
      select: { payment_id: true },
    });

    let nextNumber = 1;
    if (lastPayment?.payment_id) {
      const match = lastPayment.payment_id.match(/PAY(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PAY${String(nextNumber).padStart(4, '0')}`;
  }

  async recordInvoicePayment(companyId: string, data: RecordPaymentData, userId?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.referenceId || !data.referenceId.trim()) {
      throw new Error('Missing required field: referenceId (invoiceId)');
    }

    if (data.amount === undefined || data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Find the invoice
    const invoice = await this.prisma.invoices.findFirst({
      where: {
        company_id: companyId,
        invoice_id: data.referenceId,
        is_active: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate payment amount
    const balanceDue = Number(invoice.balance_due);
    if (data.amount > balanceDue) {
      throw new Error(`Payment amount (${data.amount}) exceeds balance due (${balanceDue})`);
    }

    // Cannot pay cancelled invoices
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot record payment for cancelled invoice');
    }

    // Cannot pay already paid invoices
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice is already fully paid');
    }

    const paymentId = await this.generatePaymentId(companyId);

    // Use transaction to update invoice and create payment
    const result = await this.prisma.$transaction(async tx => {
      // Create payment record
      const payment = await tx.payments.create({
        data: {
          id: uuidv4(),
          payment_id: paymentId,
          company_id: companyId,
          payment_type: PaymentType.INVOICE,
          reference_type: 'INVOICE',
          reference_id: data.referenceId,
          amount: data.amount,
          currency: data.currency || invoice.currency,
          payment_date: new Date(data.paymentDate),
          payment_method: data.paymentMethod as PaymentMethod,
          transaction_ref: data.transactionRef || null,
          bank_name: data.bankName || null,
          cheque_number: data.chequeNumber || null,
          cheque_date: data.chequeDate ? new Date(data.chequeDate) : null,
          upi_id: data.upiId || null,
          party_type: 'CUSTOMER',
          party_id: invoice.customer_id,
          party_name: invoice.customer_name,
          status: PaymentStatus.COMPLETED,
          notes: data.notes || null,
          receipt_url: data.receiptUrl || null,
          recorded_by: userId || null,
          is_active: true,
        },
      });

      // Update invoice
      const newAmountPaid = Number(invoice.amount_paid) + data.amount;
      const newBalanceDue = Number(invoice.total_amount) - newAmountPaid;

      let newStatus: InvoiceStatus;
      if (newBalanceDue <= 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newAmountPaid > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        newStatus = invoice.status;
      }

      await tx.invoices.update({
        where: { id: invoice.id },
        data: {
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus,
          payment_method: data.paymentMethod as PaymentMethod,
          payment_date: new Date(data.paymentDate),
          transaction_ref: data.transactionRef || null,
        },
      });

      return payment;
    });

    return this.toDto(result);
  }

  async recordBillPayment(companyId: string, data: RecordPaymentData, userId?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.referenceId || !data.referenceId.trim()) {
      throw new Error('Missing required field: referenceId (billId)');
    }

    if (data.amount === undefined || data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Find the bill
    const bill = await this.prisma.bills.findFirst({
      where: {
        company_id: companyId,
        bill_id: data.referenceId,
        is_active: true,
      },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    // Validate payment amount
    const balanceDue = Number(bill.balance_due);
    if (data.amount > balanceDue) {
      throw new Error(`Payment amount (${data.amount}) exceeds balance due (${balanceDue})`);
    }

    // Cannot pay cancelled bills
    if (bill.status === BillStatus.CANCELLED) {
      throw new Error('Cannot record payment for cancelled bill');
    }

    // Cannot pay already paid bills
    if (bill.status === BillStatus.PAID) {
      throw new Error('Bill is already fully paid');
    }

    const paymentId = await this.generatePaymentId(companyId);

    // Use transaction to update bill and create payment
    const result = await this.prisma.$transaction(async tx => {
      // Create payment record
      const payment = await tx.payments.create({
        data: {
          id: uuidv4(),
          payment_id: paymentId,
          company_id: companyId,
          payment_type: PaymentType.BILL,
          reference_type: 'BILL',
          reference_id: data.referenceId,
          amount: data.amount,
          currency: data.currency || bill.currency,
          payment_date: new Date(data.paymentDate),
          payment_method: data.paymentMethod as PaymentMethod,
          transaction_ref: data.transactionRef || null,
          bank_name: data.bankName || null,
          cheque_number: data.chequeNumber || null,
          cheque_date: data.chequeDate ? new Date(data.chequeDate) : null,
          upi_id: data.upiId || null,
          party_type: 'SUPPLIER',
          party_id: bill.supplier_id,
          party_name: bill.supplier_name,
          status: PaymentStatus.COMPLETED,
          notes: data.notes || null,
          receipt_url: data.receiptUrl || null,
          recorded_by: userId || null,
          is_active: true,
        },
      });

      // Update bill
      const newAmountPaid = Number(bill.amount_paid) + data.amount;
      const newBalanceDue = Number(bill.total_amount) - newAmountPaid;

      let newStatus: BillStatus;
      if (newBalanceDue <= 0) {
        newStatus = BillStatus.PAID;
      } else if (newAmountPaid > 0) {
        newStatus = BillStatus.PARTIALLY_PAID;
      } else {
        newStatus = bill.status;
      }

      await tx.bills.update({
        where: { id: bill.id },
        data: {
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus,
          payment_method: data.paymentMethod as PaymentMethod,
          payment_date: new Date(data.paymentDate),
          transaction_ref: data.transactionRef || null,
        },
      });

      return payment;
    });

    return this.toDto(result);
  }

  async getPayments(companyId: string, filters?: ListPaymentFilters) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (filters?.paymentType) {
      where.payment_type = filters.paymentType;
    }

    if (filters?.referenceType) {
      where.reference_type = filters.referenceType;
    }

    if (filters?.partyType) {
      where.party_type = filters.partyType;
    }

    if (filters?.partyId) {
      where.party_id = filters.partyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentMethod) {
      where.payment_method = filters.paymentMethod;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.payment_date = {};
      if (filters.fromDate) {
        where.payment_date.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.payment_date.lte = new Date(filters.toDate);
      }
    }

    const payments = await this.prisma.payments.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return payments.map(payment => this.toDto(payment));
  }

  async getPaymentById(companyId: string, paymentId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!paymentId || !paymentId.trim()) {
      throw new Error('Missing required field: paymentId');
    }

    const payment = await this.prisma.payments.findFirst({
      where: {
        company_id: companyId,
        payment_id: paymentId,
        is_active: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return this.toDto(payment);
  }

  async getPaymentsByReference(companyId: string, referenceType: string, referenceId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const payments = await this.prisma.payments.findMany({
      where: {
        company_id: companyId,
        reference_type: referenceType,
        reference_id: referenceId,
        is_active: true,
      },
      orderBy: { payment_date: 'desc' },
    });

    return payments.map(payment => this.toDto(payment));
  }

  async cancelPayment(companyId: string, paymentId: string, userId?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!paymentId || !paymentId.trim()) {
      throw new Error('Missing required field: paymentId');
    }

    const payment = await this.prisma.payments.findFirst({
      where: {
        company_id: companyId,
        payment_id: paymentId,
        is_active: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new Error('Payment is already cancelled');
    }

    // Reverse the payment in a transaction
    const result = await this.prisma.$transaction(async tx => {
      // Update payment status
      const updatedPayment = await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CANCELLED,
          notes: `${payment.notes || ''}\n[Cancelled by ${userId || 'system'}]`.trim(),
        },
      });

      // Reverse the effect on invoice/bill
      if (payment.reference_type === 'INVOICE') {
        const invoice = await tx.invoices.findFirst({
          where: { invoice_id: payment.reference_id, company_id: companyId },
        });

        if (invoice) {
          const newAmountPaid = Math.max(0, Number(invoice.amount_paid) - Number(payment.amount));
          const newBalanceDue = Number(invoice.total_amount) - newAmountPaid;

          let newStatus: InvoiceStatus;
          if (newAmountPaid === 0) {
            newStatus = InvoiceStatus.SENT;
          } else {
            newStatus = InvoiceStatus.PARTIALLY_PAID;
          }

          await tx.invoices.update({
            where: { id: invoice.id },
            data: {
              amount_paid: newAmountPaid,
              balance_due: newBalanceDue,
              status: newStatus,
            },
          });
        }
      } else if (payment.reference_type === 'BILL') {
        const bill = await tx.bills.findFirst({
          where: { bill_id: payment.reference_id, company_id: companyId },
        });

        if (bill) {
          const newAmountPaid = Math.max(0, Number(bill.amount_paid) - Number(payment.amount));
          const newBalanceDue = Number(bill.total_amount) - newAmountPaid;

          let newStatus: BillStatus;
          if (newAmountPaid === 0) {
            newStatus = BillStatus.RECEIVED;
          } else {
            newStatus = BillStatus.PARTIALLY_PAID;
          }

          await tx.bills.update({
            where: { id: bill.id },
            data: {
              amount_paid: newAmountPaid,
              balance_due: newBalanceDue,
              status: newStatus,
            },
          });
        }
      }

      return updatedPayment;
    });

    return this.toDto(result);
  }

  private toDto(payment: any) {
    return {
      id: payment.id,
      paymentId: payment.payment_id,
      companyId: payment.company_id,
      paymentType: payment.payment_type,
      referenceType: payment.reference_type,
      referenceId: payment.reference_id,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      transactionRef: payment.transaction_ref,
      bankName: payment.bank_name,
      chequeNumber: payment.cheque_number,
      chequeDate: payment.cheque_date,
      upiId: payment.upi_id,
      partyType: payment.party_type,
      partyId: payment.party_id,
      partyName: payment.party_name,
      status: payment.status,
      notes: payment.notes,
      receiptUrl: payment.receipt_url,
      recordedBy: payment.recorded_by,
      isActive: payment.is_active,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    };
  }
}

export const paymentService = new PaymentService();
