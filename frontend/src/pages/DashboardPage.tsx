import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  List,
  Avatar,
  Tag,
  Space,
  Button,
  message,
  Spin,
} from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  PlusOutlined,
  UserAddOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useHeader } from '../contexts/HeaderContext';
import useAuth from '../contexts/AuthContext';
import { Heading } from '../components/Heading';
import { MainLayout } from '../components/layout';
import { GradientButton } from '../components/ui';
import UserInviteModal from '../components/users/UserInviteModal';
import StockAlertsCard from '../components/inventory/StockAlertsCard';
import { productService } from '../services/productService';
import './DashboardPage.scss';
import { COMPANY_TEXT } from '../constants/company';

interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  teamMembers: number;
  monthlyRevenue: number;
}

interface UserInvitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

const DashboardPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();
  const [inviteDrawerVisible, setInviteDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeOrders: 0,
    teamMembers: 0,
    monthlyRevenue: 0,
  });
  const [userInvitations, setUserInvitations] = useState<UserInvitation[]>([]);

  // Set header actions when component mounts
  useEffect(() => {
    setHeaderActions(
      <GradientButton size='small' onClick={() => setInviteDrawerVisible(true)}>
        Invite Team Member
      </GradientButton>
    );

    // Cleanup when component unmounts
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      // Fetch products count
      const productsResponse = await productService.getProducts({ page: 1, limit: 1 });

      // Fetch orders count (mock for now)
      // const ordersResponse = await orderService.getOrders({ page: 1, limit: 1 });

      // Fetch team members count (mock for now)
      // const teamResponse = await userService.getTeamMembers();

      setStats({
        totalProducts: productsResponse.pagination?.total || 0,
        activeOrders: 0, // Will be implemented when orders API is ready
        teamMembers: 1, // Current user at minimum
        monthlyRevenue: 0, // Will be calculated from orders
      });

      // Clear invitations - only show live data
      setUserInvitations([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentCompany?.id]);

  const statsConfig = [
    {
      title: COMPANY_TEXT.TOTAL_PRODUCTS,
      value: stats.totalProducts,
      icon: <BankOutlined />,
      color: '#7b5fc9',
    },
    {
      title: COMPANY_TEXT.ACTIVE_ORDERS,
      value: stats.activeOrders,
      icon: <ShoppingCartOutlined />,
      color: '#a2d8e5',
    },
    {
      title: COMPANY_TEXT.TEAM_MEMBERS,
      value: stats.teamMembers,
      icon: <TeamOutlined />,
      color: '#52c41a',
    },
    {
      title: COMPANY_TEXT.MONTHLY_REVENUE,
      value: `$${stats.monthlyRevenue}`,
      icon: <BarChartOutlined />,
      color: '#faad14',
    },
  ];

  const quickActions = [
    {
      title: COMPANY_TEXT.ADD_PRODUCT,
      icon: <PlusOutlined />,
      description: COMPANY_TEXT.ADD_PRODUCT_DESC,
      action: () => navigate('/products'),
    },
    {
      title: COMPANY_TEXT.NEW_ORDER,
      icon: <ShoppingCartOutlined />,
      description: COMPANY_TEXT.NEW_ORDER_DESC,
      action: () => navigate('/orders'),
    },
    {
      title: COMPANY_TEXT.INVITE_TEAM,
      icon: <TeamOutlined />,
      description: COMPANY_TEXT.INVITE_TEAM_DESC,
      action: () => setInviteDrawerVisible(true),
    },
    {
      title: COMPANY_TEXT.VIEW_REPORTS,
      icon: <BarChartOutlined />,
      description: COMPANY_TEXT.VIEW_REPORTS_DESC,
      action: () => navigate('/reports'),
    },
  ];

  // Handle user invitation actions
  const handleAcceptInvitation = (invitationId: string) => {
    setUserInvitations(prev =>
      prev
        .map(inv => (inv.id === invitationId ? { ...inv, status: 'ACCEPTED' as const } : inv))
        .filter(inv => inv.status !== 'ACCEPTED')
    );
    message.success('Invitation accepted');
  };

  const handleDeclineInvitation = (invitationId: string) => {
    setUserInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    message.success('Invitation declined');
  };

  const handleInviteSuccess = () => {
    // Refresh dashboard data to get updated invitations
    fetchDashboardData();
  };

  return (
    <MainLayout>
      <div className='dashboard-container'>
        <div className='page-container'>
          <div className='page-header-section'>
            <Heading level={2}>Dashboard</Heading>
          </div>

          <div className='dashboard-content'>
            <div className='dashboard-stats'>
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {statsConfig.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                      <Card className='dashboard-stat-card'>
                        <Statistic
                          title={stat.title}
                          value={stat.value}
                          prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                          valueStyle={{ color: stat.color }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Spin>
            </div>

            <div className='dashboard-quick-actions'>
              <Heading level={3}>Quick Actions</Heading>
              <Row gutter={[16, 16]}>
                {quickActions.map((action, index) => (
                  <Col xs={24} sm={12} lg={6} key={index}>
                    <Card className='dashboard-action-card' hoverable onClick={action.action}>
                      <div className='dashboard-action-icon' style={{ color: '#7b5fc9' }}>
                        {action.icon}
                      </div>
                      <div className='dashboard-action-content'>
                        <h4>{action.title}</h4>
                        <p>{action.description}</p>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Stock Alerts Section */}
            <div className='dashboard-alerts-section'>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <StockAlertsCard maxItems={5} showHeader={true} />
                </Col>

                {/* User Invitations Card */}
                {userInvitations.length > 0 && (
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserAddOutlined style={{ color: '#7b5fc9' }} />
                          <Typography.Title level={5} style={{ margin: 0 }}>
                            Pending Invitations
                          </Typography.Title>
                        </div>
                      }
                      style={{ height: '100%' }}
                    >
                      <List
                        dataSource={userInvitations}
                        renderItem={invitation => (
                          <List.Item
                            actions={[
                              <Button
                                key='accept'
                                type='primary'
                                size='small'
                                icon={<CheckOutlined />}
                                onClick={() => handleAcceptInvitation(invitation.id)}
                              >
                                Accept
                              </Button>,
                              <Button
                                key='decline'
                                size='small'
                                icon={<CloseOutlined />}
                                onClick={() => handleDeclineInvitation(invitation.id)}
                              >
                                Decline
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<TeamOutlined />} />}
                              title={invitation.email}
                              description={
                                <Space>
                                  <Tag color='blue'>{invitation.role}</Tag>
                                  <Typography.Text type='secondary'>
                                    Invited by {invitation.invitedBy}
                                  </Typography.Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          </div>
        </div>

        <UserInviteModal
          visible={inviteDrawerVisible}
          onClose={() => setInviteDrawerVisible(false)}
          onSuccess={handleInviteSuccess}
        />
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
