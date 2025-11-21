import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Timeline,
  Avatar,
  Divider,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  LeftOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { userService, UserDetail } from '../services/userService';
import './UserProfilePage.scss';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await userService.getUserById(userId);
      setUser(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'blue';
      case 'ADMIN':
        return 'purple';
      case 'MANAGER':
        return 'green';
      case 'EMPLOYEE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="user-profile-page loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile-page">
      <div className="page-header">
        <Button
          icon={<LeftOutlined />}
          onClick={() => navigate('/users')}
          type="text"
        >
          Back to Users
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card className="profile-card">
            <div className="profile-header">
              <Avatar 
                size={100} 
                src={user.avatarUrl}
                style={{ backgroundColor: user.avatarUrl ? 'transparent' : '#7b5fc9' }}
              >
                {!user.avatarUrl && getInitials(user.firstName, user.lastName)}
              </Avatar>
              <h2>
                {user.firstName} {user.lastName}
              </h2>
              <Tag color={getRoleBadgeColor(user.role)} style={{ fontSize: 14 }}>
                {user.role}
              </Tag>
              <div className="status-badge">
                {user.isActive ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Active
                  </Tag>
                ) : (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    Inactive
                  </Tag>
                )}
              </div>
            </div>

            <Divider />

            <div className="contact-info">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div className="info-item">
                  <MailOutlined className="icon" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="info-item">
                    <PhoneOutlined className="icon" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="info-item">
                  <CalendarOutlined className="icon" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </Space>
            </div>

            <Divider />

            <Button
              type="primary"
              icon={<EditOutlined />}
              block
              onClick={() => navigate(`/users/${user.id}/edit`)}
            >
              Edit Profile
            </Button>
          </Card>

          <Card title="Statistics" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Active Sessions"
                  value={user.sessions.length}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Days Active"
                  value={Math.floor(
                    (new Date().getTime() - new Date(user.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="User Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="First Name" span={1}>
                {user.firstName}
              </Descriptions.Item>
              <Descriptions.Item label="Last Name" span={1}>
                {user.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone" span={2}>
                {user.phone || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Role" span={1}>
                <Tag color={getRoleBadgeColor(user.role)}>{user.role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={1}>
                {user.isActive ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag color="error">Inactive</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Department" span={2}>
                {user.department || 'Not assigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={2}>
                {user.locationId || 'Not assigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At" span={1}>
                {formatDate(user.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated" span={1}>
                {formatDate(user.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Role & Permissions" style={{ marginTop: 24 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="Current Role">
                <Tag color={getRoleBadgeColor(user.role)} style={{ fontSize: 14 }}>
                  {user.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Permissions">
                {user.role === 'OWNER' && (
                  <Space direction="vertical">
                    <Tag color="blue">Full System Access</Tag>
                    <Tag color="blue">Manage All Users</Tag>
                    <Tag color="blue">Company Settings</Tag>
                    <Tag color="blue">Billing & Subscription</Tag>
                  </Space>
                )}
                {user.role === 'ADMIN' && (
                  <Space direction="vertical">
                    <Tag color="purple">Manage Users</Tag>
                    <Tag color="purple">All Modules Access</Tag>
                    <Tag color="purple">Reports & Analytics</Tag>
                    <Tag color="purple">Settings</Tag>
                  </Space>
                )}
                {user.role === 'MANAGER' && (
                  <Space direction="vertical">
                    <Tag color="green">Team Management</Tag>
                    <Tag color="green">Module Access</Tag>
                    <Tag color="green">Reports</Tag>
                  </Space>
                )}
                {user.role === 'EMPLOYEE' && (
                  <Space direction="vertical">
                    <Tag>Limited Module Access</Tag>
                    <Tag>Basic Operations</Tag>
                  </Space>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Recent Activity" style={{ marginTop: 24 }}>
            <Timeline
              items={user.sessions.slice(0, 10).map((session) => ({
                children: (
                  <div>
                    <div className="activity-title">Login Session</div>
                    <div className="activity-time">
                      {formatDateTime(session.lastActive)}
                    </div>
                  </div>
                ),
                color: 'blue',
              }))}
            />
            {user.sessions.length === 0 && (
              <div className="no-activity">No recent activity</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfilePage;
