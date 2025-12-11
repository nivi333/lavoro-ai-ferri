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
  Tabs,
} from 'antd';
import {
  MoreOutlined,
  DollarOutlined,
  PlusOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton, PageBreadcrumb } from '../../components/ui';
import {
  pettyCashService,
  PettyCashAccount,
  PettyCashTransaction,
  PettyCashTransactionType,
  CreateAccountRequest,
  CreateTransactionRequest,
} from '../../services/pettyCashService';
import './PettyCashPage.scss';

const { Option } = Select;
const { TextArea } = Input;

const TRANSACTION_TYPE_COLORS: Record<PettyCashTransactionType, string> = {
  REPLENISHMENT: 'green',
  DISBURSEMENT: 'red',
  ADJUSTMENT: 'blue',
};

const TRANSACTION_TYPE_LABELS: Record<PettyCashTransactionType, string> = {
  REPLENISHMENT: 'Replenishment',
  DISBURSEMENT: 'Disbursement',
  ADJUSTMENT: 'Adjustment',
};

const DISBURSEMENT_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Meals',
  'Transportation',
  'Postage',
  'Utilities',
  'Repairs',
  'Miscellaneous',
];

export default function PettyCashPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [accounts, setAccounts] = useState<PettyCashAccount[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedAccount, setSelectedAccount] = useState<PettyCashAccount | null>(null);

  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [accountForm] = Form.useForm();
  const [transactionForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalAccounts: 0,
    lowBalanceAccounts: 0,
    monthlyDisbursements: 0,
  });

  useEffect(() => {
    setHeaderActions(
      <Space>
        <GradientButton
          size='small'
          onClick={() => setTransactionModalOpen(true)}
        >
          <PlusOutlined /> Record Transaction
        </GradientButton>
        <GradientButton
          size='small'
          onClick={() => setAccountModalOpen(true)}
        >
          <WalletOutlined /> New Account
        </GradientButton>
      </Space>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsData, transactionsData] = await Promise.all([
        pettyCashService.getAccounts(),
        pettyCashService.getTransactions(),
      ]);

      setAccounts(accountsData);
      setTransactions(transactionsData);

      // Calculate stats
      const totalBalance = accountsData.reduce((sum, acc) => sum + acc.currentBalance, 0);
      const lowBalanceAccounts = accountsData.filter(
        acc => acc.minBalance && acc.currentBalance < acc.minBalance
      ).length;

      // Calculate monthly disbursements
      const startOfMonth = dayjs().startOf('month');
      const monthlyDisbursements = transactionsData
        .filter(
          t =>
            t.transactionType === 'DISBURSEMENT' &&
            dayjs(t.transactionDate).isAfter(startOfMonth)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalBalance,
        totalAccounts: accountsData.length,
        lowBalanceAccounts,
        monthlyDisbursements,
      });
    } catch (error: any) {
      console.error('Error fetching petty cash data:', error);
      message.error(error.message || 'Failed to fetch petty cash data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const values = await accountForm.validateFields();
      setSubmitting(true);

      const accountData: CreateAccountRequest = {
        name: values.name,
        description: values.description,
        currency: values.currency || 'INR',
        initialBalance: values.initialBalance,
        maxLimit: values.maxLimit,
        minBalance: values.minBalance,
        custodianName: values.custodianName,
      };

      await pettyCashService.createAccount(accountData);
      message.success('Petty cash account created successfully');
      setAccountModalOpen(false);
      accountForm.resetFields();
      fetchData();
    } catch (error: any) {
      console.error('Error creating account:', error);
      message.error(error.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      const values = await transactionForm.validateFields();
      setSubmitting(true);

      const transactionData: CreateTransactionRequest = {
        accountId: values.accountId,
        transactionType: values.transactionType,
        amount: values.amount,
        transactionDate: values.transactionDate.format('YYYY-MM-DD'),
        description: values.description,
        category: values.category,
        recipientName: values.recipientName,
        receiptNumber: values.receiptNumber,
        notes: values.notes,
      };

      await pettyCashService.createTransaction(transactionData);
      message.success('Transaction recorded successfully');
      setTransactionModalOpen(false);
      transactionForm.resetFields();
      fetchData();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      message.error(error.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const accountColumns = [
    {
      title: 'Account',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record: PettyCashAccount) => (
        <div>
          <div className='account-name'>{value}</div>
          <div className='account-id'>{record.accountId}</div>
        </div>
      ),
    },
    {
      title: 'Custodian',
      dataIndex: 'custodianName',
      key: 'custodianName',
      render: (value: string) => value || '-',
    },
    {
      title: 'Current Balance',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      render: (value: number, record: PettyCashAccount) => {
        const isLow = record.minBalance && value < record.minBalance;
        return (
          <span style={{ color: isLow ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
            {record.currency} {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            {isLow && <WarningOutlined style={{ marginLeft: 8, color: '#ff4d4f' }} />}
          </span>
        );
      },
    },
    {
      title: 'Limits',
      key: 'limits',
      render: (_: any, record: PettyCashAccount) => (
        <div>
          {record.maxLimit && <div>Max: {record.currency} {record.maxLimit.toLocaleString()}</div>}
          {record.minBalance && <div>Min: {record.currency} {record.minBalance.toLocaleString()}</div>}
          {!record.maxLimit && !record.minBalance && '-'}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PettyCashAccount) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                onClick: () => {
                  setSelectedAccount(record);
                  setActiveTab('transactions');
                },
              },
              {
                key: 'replenish',
                label: 'Replenish',
                onClick: () => {
                  transactionForm.setFieldsValue({
                    accountId: record.id,
                    transactionType: 'REPLENISHMENT',
                    transactionDate: dayjs(),
                  });
                  setTransactionModalOpen(true);
                },
              },
              {
                key: 'disburse',
                label: 'Record Disbursement',
                onClick: () => {
                  transactionForm.setFieldsValue({
                    accountId: record.id,
                    transactionType: 'DISBURSEMENT',
                    transactionDate: dayjs(),
                  });
                  setTransactionModalOpen(true);
                },
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type='text' icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: 'Transaction',
      dataIndex: 'transactionId',
      key: 'transactionId',
      render: (value: string, record: PettyCashTransaction) => (
        <div>
          <div className='transaction-id'>{value}</div>
          <div className='transaction-date'>
            {dayjs(record.transactionDate).format('DD MMM YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      render: (account: PettyCashAccount) => account?.name || '-',
    },
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (value: PettyCashTransactionType) => (
        <Tag color={TRANSACTION_TYPE_COLORS[value]}>
          {value === 'REPLENISHMENT' && <ArrowUpOutlined />}
          {value === 'DISBURSEMENT' && <ArrowDownOutlined />}
          {' '}{TRANSACTION_TYPE_LABELS[value]}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number, record: PettyCashTransaction) => (
        <span
          style={{
            color: record.transactionType === 'DISBURSEMENT' ? '#ff4d4f' : '#52c41a',
            fontWeight: 600,
          }}
        >
          {record.transactionType === 'DISBURSEMENT' ? '-' : '+'}
          {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Balance After',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (value: number) => value.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string, record: PettyCashTransaction) => (
        <div>
          <div>{value || '-'}</div>
          {record.category && <Tag>{record.category}</Tag>}
        </div>
      ),
    },
    {
      title: 'Recipient',
      dataIndex: 'recipientName',
      key: 'recipientName',
      render: (value: string) => value || '-',
    },
  ];

  const breadcrumbItems = [
    { title: 'Home', path: '/dashboard' },
    { title: 'Finance', path: '/finance' },
    { title: 'Petty Cash' },
  ];

  const filteredTransactions = selectedAccount
    ? transactions.filter(t => t.accountId === selectedAccount.id)
    : transactions;

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='petty-cash-page'>
          <Empty description='Please select a company to view petty cash' />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='petty-cash-page'>
        <PageBreadcrumb items={breadcrumbItems} />

        <div className='page-header'>
          <Heading level={2}>Petty Cash Management</Heading>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} className='stats-row'>
          <Col xs={24} sm={12} md={6}>
            <Card className='stat-card'>
              <Statistic
                title='Total Balance'
                value={stats.totalBalance}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='stat-card'>
              <Statistic
                title='Active Accounts'
                value={stats.totalAccounts}
                prefix={<WalletOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='stat-card'>
              <Statistic
                title='Low Balance Alerts'
                value={stats.lowBalanceAccounts}
                prefix={<WarningOutlined />}
                valueStyle={{ color: stats.lowBalanceAccounts > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className='stat-card'>
              <Statistic
                title='Monthly Disbursements'
                value={stats.monthlyDisbursements}
                precision={2}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <div className='content-section'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={key => {
                setActiveTab(key);
                if (key === 'accounts') setSelectedAccount(null);
              }}
              items={[
                {
                  key: 'accounts',
                  label: 'Accounts',
                  children: (
                    <>
                      {accounts.length === 0 ? (
                        <Empty
                          description='No petty cash accounts found'
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                          <GradientButton onClick={() => setAccountModalOpen(true)}>
                            Create First Account
                          </GradientButton>
                        </Empty>
                      ) : (
                        <Table
                          columns={accountColumns}
                          dataSource={accounts}
                          rowKey={record => record.id || record.accountId}
                          pagination={{ pageSize: 10 }}
                          className='accounts-table'
                        />
                      )}
                    </>
                  ),
                },
                {
                  key: 'transactions',
                  label: selectedAccount
                    ? `Transactions - ${selectedAccount.name}`
                    : 'All Transactions',
                  children: (
                    <>
                      {selectedAccount && (
                        <div className='selected-account-info'>
                          <Space>
                            <Tag color='blue'>{selectedAccount.name}</Tag>
                            <span>
                              Balance: {selectedAccount.currency}{' '}
                              {selectedAccount.currentBalance.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <Button size='small' onClick={() => setSelectedAccount(null)}>
                              Clear Filter
                            </Button>
                          </Space>
                        </div>
                      )}
                      {filteredTransactions.length === 0 ? (
                        <Empty
                          description='No transactions found'
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ) : (
                        <Table
                          columns={transactionColumns}
                          dataSource={filteredTransactions}
                          rowKey={record => record.id || record.transactionId}
                          pagination={{ pageSize: 10 }}
                          className='transactions-table'
                        />
                      )}
                    </>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      <Modal
        title='Create Petty Cash Account'
        open={accountModalOpen}
        onCancel={() => {
          setAccountModalOpen(false);
          accountForm.resetFields();
        }}
        footer={[
          <Button
            key='cancel'
            onClick={() => {
              setAccountModalOpen(false);
              accountForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <GradientButton key='submit' loading={submitting} onClick={handleCreateAccount}>
            Create Account
          </GradientButton>,
        ]}
        width={500}
      >
        <Form form={accountForm} layout='vertical'>
          <Form.Item
            name='name'
            label='Account Name'
            rules={[{ required: true, message: 'Please enter account name' }]}
          >
            <Input placeholder='e.g., Main Office Petty Cash' />
          </Form.Item>

          <Form.Item name='description' label='Description'>
            <TextArea rows={2} placeholder='Account description' />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='initialBalance'
                label='Initial Balance'
                rules={[{ required: true, message: 'Please enter initial balance' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='currency' label='Currency' initialValue='INR'>
                <Select>
                  <Option value='INR'>INR</Option>
                  <Option value='USD'>USD</Option>
                  <Option value='EUR'>EUR</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name='maxLimit' label='Maximum Limit'>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder='Optional'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='minBalance' label='Minimum Balance Alert'>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder='Optional'
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='custodianName' label='Custodian Name'>
            <Input placeholder='Person responsible for this account' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Transaction Modal */}
      <Modal
        title='Record Petty Cash Transaction'
        open={transactionModalOpen}
        onCancel={() => {
          setTransactionModalOpen(false);
          transactionForm.resetFields();
        }}
        footer={[
          <Button
            key='cancel'
            onClick={() => {
              setTransactionModalOpen(false);
              transactionForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <GradientButton key='submit' loading={submitting} onClick={handleCreateTransaction}>
            Record Transaction
          </GradientButton>,
        ]}
        width={600}
      >
        <Form form={transactionForm} layout='vertical'>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='accountId'
                label='Account'
                rules={[{ required: true, message: 'Please select an account' }]}
              >
                <Select placeholder='Select account'>
                  {accounts.map(acc => (
                    <Option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {acc.currentBalance.toLocaleString()})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='transactionType'
                label='Transaction Type'
                rules={[{ required: true, message: 'Please select transaction type' }]}
              >
                <Select placeholder='Select type'>
                  <Option value='REPLENISHMENT'>
                    <ArrowUpOutlined style={{ color: '#52c41a' }} /> Replenishment
                  </Option>
                  <Option value='DISBURSEMENT'>
                    <ArrowDownOutlined style={{ color: '#ff4d4f' }} /> Disbursement
                  </Option>
                  <Option value='ADJUSTMENT'>Adjustment</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='amount'
                label='Amount'
                rules={[
                  { required: true, message: 'Please enter amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  precision={2}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='transactionDate'
                label='Date'
                rules={[{ required: true, message: 'Please select date' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.transactionType !== currentValues.transactionType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('transactionType') === 'DISBURSEMENT' && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name='category' label='Category'>
                      <Select placeholder='Select category' allowClear>
                        {DISBURSEMENT_CATEGORIES.map(cat => (
                          <Option key={cat} value={cat}>
                            {cat}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name='recipientName' label='Recipient'>
                      <Input placeholder='Who received the cash' />
                    </Form.Item>
                  </Col>
                </Row>
              )
            }
          </Form.Item>

          <Form.Item name='description' label='Description'>
            <TextArea rows={2} placeholder='Transaction description' />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name='receiptNumber' label='Receipt Number'>
                <Input placeholder='Receipt/voucher number' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='notes' label='Notes'>
                <Input placeholder='Additional notes' />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </MainLayout>
  );
}
