import { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Dropdown,
  Empty,
  Spin,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
} from 'antd';
import { MoreOutlined, DollarOutlined, HomeOutlined } from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton, PageBreadcrumb } from '../../components/ui';
import {
  expenseService,
  ExpenseSummary,
  ExpenseStatus,
  ExpenseCategory,
  CreateExpenseRequest,
} from '../../services/expenseService';
import './ExpensesPage.scss';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  PENDING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  PAID: 'green',
  CANCELLED: 'volcano',
};

function getStatusLabel(status: ExpenseStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'PAID':
      return 'Paid';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

function getCategoryLabel(category: ExpenseCategory): string {
  return category
    .replace('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

export default function ExpensesPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  // Using useNavigate hook for potential future navigation needs

  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
  });

  useEffect(() => {
    setHeaderActions(
      <GradientButton size='small' onClick={() => showCreateModal()}>
        Create Expense
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const expensesData = await expenseService.getExpenses();
      setExpenses(expensesData);

      // Calculate statistics
      const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
      const pendingExpenses = expensesData
        .filter(expense => expense.status === 'PENDING')
        .reduce((sum, expense) => sum + expense.amount, 0);
      const approvedExpenses = expensesData
        .filter(expense => expense.status === 'APPROVED' || expense.status === 'PAID')
        .reduce((sum, expense) => sum + expense.amount, 0);
      const rejectedExpenses = expensesData
        .filter(expense => expense.status === 'REJECTED' || expense.status === 'CANCELLED')
        .reduce((sum, expense) => sum + expense.amount, 0);

      setStats({
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
      });
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      message.error(error.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const showCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      expenseDate: dayjs(),
      currency: 'USD',
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreateExpense = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const expenseData: CreateExpenseRequest = {
        title: values.title,
        description: values.description,
        category: values.category,
        amount: values.amount,
        currency: values.currency,
        expenseDate: values.expenseDate.format('YYYY-MM-DD'),
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined,
        employeeName: values.employeeName,
        notes: values.notes,
      };

      await expenseService.createExpense(expenseData);
      message.success('Expense created successfully');
      setIsModalVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      message.error(error.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewExpense = (expense: ExpenseSummary) => {
    // This would navigate to a detailed view of the expense
    message.info(`View expense ${expense.expenseId}`);
  };

  const handleApproveExpense = async (expense: ExpenseSummary) => {
    try {
      setTableLoading(true);
      await expenseService.updateExpenseStatus(expense.expenseId, 'APPROVED');
      message.success('Expense approved successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error approving expense:', error);
      message.error(error.message || 'Failed to approve expense');
    } finally {
      setTableLoading(false);
    }
  };

  const handleRejectExpense = async (expense: ExpenseSummary) => {
    try {
      setTableLoading(true);
      await expenseService.updateExpenseStatus(expense.expenseId, 'REJECTED');
      message.success('Expense rejected successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error rejecting expense:', error);
      message.error(error.message || 'Failed to reject expense');
    } finally {
      setTableLoading(false);
    }
  };

  const handleMarkAsPaid = async (expense: ExpenseSummary) => {
    try {
      setTableLoading(true);
      await expenseService.updateExpenseStatus(expense.expenseId, 'PAID');
      message.success('Expense marked as paid successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error marking expense as paid:', error);
      message.error(error.message || 'Failed to mark expense as paid');
    } finally {
      setTableLoading(false);
    }
  };

  const columns = [
    {
      title: 'Expense ID',
      dataIndex: 'expenseId',
      key: 'expenseId',
      render: (value: string) => <div className='expense-id'>{value}</div>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (value: string, record: ExpenseSummary) => (
        <div>
          <div className='expense-title'>{value}</div>
          {record.employeeName && <div className='expense-employee'>By: {record.employeeName}</div>}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: ExpenseCategory) => getCategoryLabel(category),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: ExpenseStatus) => (
        <Tag color={STATUS_COLORS[status]} className='status-tag'>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (value: number, record: ExpenseSummary) => {
        const amount = typeof value === 'number' ? value : parseFloat(value || '0');
        return (
          <span className='expense-amount'>
            {record.currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: ExpenseSummary) => {
        const menuItems = [
          {
            key: 'view',
            label: 'View Details',
            onClick: () => handleViewExpense(record),
          },
        ];

        if (record.status === 'PENDING') {
          menuItems.push(
            {
              key: 'approve',
              label: 'Approve',
              onClick: () => handleApproveExpense(record),
            },
            {
              key: 'reject',
              label: 'Reject',
              onClick: () => handleRejectExpense(record),
            }
          );
        }

        if (record.status === 'APPROVED') {
          menuItems.push({
            key: 'paid',
            label: 'Mark as Paid',
            onClick: () => handleMarkAsPaid(record),
          });
        }

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
              <Button type='text' icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage expenses.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='expenses-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <PageBreadcrumb
              items={[
                {
                  title: 'Finance Overview',
                  path: '/finance',
                  icon: <HomeOutlined />,
                },
                {
                  title: 'Expenses',
                },
              ]}
            />
            <Heading level={2} className='page-title'>
              Expenses
            </Heading>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className='stats-row'>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Total Expenses'
                  value={stats.totalExpenses}
                  precision={2}
                  valueStyle={{ color: '#7b5fc9' }}
                  prefix={<DollarOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Pending Expenses'
                  value={stats.pendingExpenses}
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<DollarOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Approved Expenses'
                  value={stats.approvedExpenses}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<DollarOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Rejected Expenses'
                  value={stats.rejectedExpenses}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<DollarOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
          </Row>

          <div className='table-container'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
              </div>
            ) : expenses.length === 0 ? (
              <Empty description='No expenses found'>
                <GradientButton size='small' onClick={showCreateModal}>
                  Create First Expense
                </GradientButton>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={expenses}
                rowKey={record => record.id || record.expenseId}
                loading={tableLoading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className='expenses-table'
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Expense Modal */}
      <Modal
        title='Create Expense'
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key='cancel' onClick={handleCancel}>
            Cancel
          </Button>,
          <GradientButton key='submit' loading={submitting} onClick={handleCreateExpense}>
            Create
          </GradientButton>,
        ]}
        width={600}
      >
        <Form form={form} layout='vertical' className='expense-form'>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name='title'
                label='Title'
                rules={[{ required: true, message: 'Please enter expense title' }]}
              >
                <Input placeholder='Enter expense title' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='category'
                label='Category'
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder='Select category'>
                  <Option value='RENT'>Rent</Option>
                  <Option value='UTILITIES'>Utilities</Option>
                  <Option value='SALARIES'>Salaries</Option>
                  <Option value='EQUIPMENT'>Equipment</Option>
                  <Option value='SUPPLIES'>Supplies</Option>
                  <Option value='MAINTENANCE'>Maintenance</Option>
                  <Option value='TRAVEL'>Travel</Option>
                  <Option value='MARKETING'>Marketing</Option>
                  <Option value='INSURANCE'>Insurance</Option>
                  <Option value='TAXES'>Taxes</Option>
                  <Option value='MISCELLANEOUS'>Miscellaneous</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='expenseDate'
                label='Expense Date'
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='amount'
                label='Amount'
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder='0.00' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='currency'
                label='Currency'
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select placeholder='Select currency'>
                  <Option value='USD'>USD</Option>
                  <Option value='EUR'>EUR</Option>
                  <Option value='GBP'>GBP</Option>
                  <Option value='INR'>INR</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name='paymentMethod' label='Payment Method'>
                <Select placeholder='Select payment method'>
                  <Option value='CASH'>Cash</Option>
                  <Option value='CHEQUE'>Cheque</Option>
                  <Option value='BANK_TRANSFER'>Bank Transfer</Option>
                  <Option value='UPI'>UPI</Option>
                  <Option value='CARD'>Card</Option>
                  <Option value='OTHER'>Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='paymentDate' label='Payment Date'>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name='employeeName' label='Employee Name'>
                <Input placeholder='Enter employee name' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name='description' label='Description'>
                <TextArea rows={3} placeholder='Enter expense description' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name='notes' label='Notes'>
                <TextArea rows={2} placeholder='Enter additional notes' />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </MainLayout>
  );
}
