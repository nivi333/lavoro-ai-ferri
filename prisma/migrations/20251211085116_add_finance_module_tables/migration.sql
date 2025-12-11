-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SALARIES', 'EQUIPMENT', 'SUPPLIES', 'MAINTENANCE', 'TRAVEL', 'MARKETING', 'INSURANCE', 'TAXES', 'RAW_MATERIALS', 'SHIPPING', 'PROFESSIONAL_SERVICES', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('INVOICE_PAYMENT', 'BILL_PAYMENT', 'EXPENSE_PAYMENT', 'REFUND', 'ADVANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PettyCashTransactionType" AS ENUM ('REPLENISHMENT', 'DISBURSEMENT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expense_date" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "payment_method" "PaymentMethod",
    "payment_date" TIMESTAMP(3),
    "transaction_ref" TEXT,
    "employee_id" TEXT,
    "employee_name" TEXT,
    "receipt_url" TEXT,
    "attachments" TEXT[],
    "notes" TEXT,
    "tags" TEXT[],
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_period" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "transaction_ref" TEXT,
    "bank_name" TEXT,
    "cheque_number" TEXT,
    "cheque_date" TIMESTAMP(3),
    "upi_id" TEXT,
    "party_type" TEXT NOT NULL,
    "party_id" TEXT,
    "party_name" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "receipt_url" TEXT,
    "recorded_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_accounts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "initial_balance" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL,
    "max_limit" DECIMAL(12,2),
    "min_balance" DECIMAL(12,2),
    "custodian_id" TEXT,
    "custodian_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_transactions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "transaction_type" "PettyCashTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance_before" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "recipient_name" TEXT,
    "receipt_number" TEXT,
    "receipt_url" TEXT,
    "approved_by" TEXT,
    "recorded_by" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit" (
    "id" TEXT NOT NULL,
    "credit_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "available_credit" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "credit_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "credit_hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_reason" TEXT,
    "last_review_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_id_key" ON "expenses"("expense_id");

-- CreateIndex
CREATE INDEX "expenses_company_id_idx" ON "expenses"("company_id");

-- CreateIndex
CREATE INDEX "expenses_location_id_idx" ON "expenses"("location_id");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_company_id_expense_id_key" ON "expenses"("company_id", "expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_id_key" ON "payments"("payment_id");

-- CreateIndex
CREATE INDEX "payments_company_id_idx" ON "payments"("company_id");

-- CreateIndex
CREATE INDEX "payments_payment_type_idx" ON "payments"("payment_type");

-- CreateIndex
CREATE INDEX "payments_reference_type_reference_id_idx" ON "payments"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "payments_party_type_party_id_idx" ON "payments"("party_type", "party_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_company_id_payment_id_key" ON "payments"("company_id", "payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_accounts_account_id_key" ON "petty_cash_accounts"("account_id");

-- CreateIndex
CREATE INDEX "petty_cash_accounts_company_id_idx" ON "petty_cash_accounts"("company_id");

-- CreateIndex
CREATE INDEX "petty_cash_accounts_location_id_idx" ON "petty_cash_accounts"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_accounts_company_id_account_id_key" ON "petty_cash_accounts"("company_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_transactions_transaction_id_key" ON "petty_cash_transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "petty_cash_transactions_company_id_idx" ON "petty_cash_transactions"("company_id");

-- CreateIndex
CREATE INDEX "petty_cash_transactions_account_id_idx" ON "petty_cash_transactions"("account_id");

-- CreateIndex
CREATE INDEX "petty_cash_transactions_transaction_type_idx" ON "petty_cash_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "petty_cash_transactions_transaction_date_idx" ON "petty_cash_transactions"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_transactions_company_id_transaction_id_key" ON "petty_cash_transactions"("company_id", "transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_credit_id_key" ON "customer_credit"("credit_id");

-- CreateIndex
CREATE INDEX "customer_credit_company_id_idx" ON "customer_credit"("company_id");

-- CreateIndex
CREATE INDEX "customer_credit_customer_id_idx" ON "customer_credit"("customer_id");

-- CreateIndex
CREATE INDEX "customer_credit_credit_status_idx" ON "customer_credit"("credit_status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_company_id_customer_id_key" ON "customer_credit"("company_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_company_id_credit_id_key" ON "customer_credit"("company_id", "credit_id");

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "petty_cash_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
