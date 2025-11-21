import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  BankOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ToolOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import './Sidebar.scss';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany, logout } = useAuth();
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  // Navigation menu items
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'manufacturing',
      icon: <ToolOutlined />,
      label: 'Manufacturing',
      children: [
        {
          key: '/production',
          icon: <SettingOutlined />,
          label: 'Production',
        },
        {
          key: 'quality',
          icon: <SafetyOutlined />,
          label: 'Quality Control',
          children: [
            {
              key: '/quality/checkpoints',
              label: 'Checkpoints',
            },
            {
              key: '/quality/defects',
              label: 'Defects',
            },
            {
              key: '/quality/compliance',
              label: 'Compliance',
            },
          ],
        },
      ],
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: 'Inventory',
      children: [
        {
          key: '/products',
          icon: <AppstoreOutlined />,
          label: 'Products',
        },
        {
          key: '/inventory',
          icon: <InboxOutlined />,
          label: 'Stock Management',
        },
        {
          key: '/procurement',
          icon: <ShoppingCartOutlined />,
          label: 'Procurement',
        },
      ],
    },
    {
      key: 'sales',
      icon: <BarChartOutlined />,
      label: 'Sales & Orders',
      children: [
        {
          key: '/orders',
          icon: <FileTextOutlined />,
          label: 'Orders',
        },
        {
          key: '/customers',
          icon: <TeamOutlined />,
          label: 'Customers',
        },
      ],
    },
    {
      key: 'finance',
      icon: <BankOutlined />,
      label: 'Finance',
      children: [
        {
          key: '/accounting',
          icon: <FileTextOutlined />,
          label: 'Accounting',
        },
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: 'Financial Reports',
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Company switching now handled by navigating to /companies

  // Company switcher dropdown menu
  const companyMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'company-settings',
      icon: <SettingOutlined />,
      label: 'Company Details',
      onClick: () => currentCompany && navigate(`/companies/${currentCompany.id}`),
    },
    {
      key: 'location',
      icon: <BankOutlined />,
      label: 'Location',
      onClick: () => navigate('/locations'),
    },
    {
      key: 'switch-company',
      icon: <BankOutlined />,
      label: 'Switch Company / Role',
      onClick: () => navigate('/companies'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log Out',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  const getSelectedKeys = () => {
    return [location.pathname];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/production') || path.includes('/quality')) {
      return ['manufacturing'];
    }
    if (path.includes('/inventory') || path.includes('/procurement') || path.includes('/products')) {
      return ['inventory'];
    }
    if (path.includes('/orders') || path.includes('/customers')) {
      return ['sales'];
    }
    if (path.includes('/accounting') || path.includes('/reports')) {
      return ['finance'];
    }
    return [];
  };

  return (
    <Sider trigger={null} width={280} className='app-sidebar' theme='light'>
      <div className='sidebar-container'>
        {/* Header / Company */}
        {currentCompany && (
          <Dropdown
            menu={{ items: companyMenuItems }}
            trigger={['click']}
            open={companyDropdownOpen}
            onOpenChange={setCompanyDropdownOpen}
            placement='bottomLeft'
          >
            <div className='sidebar-header'>
              <Avatar size={32} style={{ border: '1px solid #b3b3b3', padding: '2px' }} src={currentCompany.logoUrl}>
                {currentCompany.name.charAt(0)}
              </Avatar>
              <div className='company-details'>
                <div className='company-name'>{currentCompany.name}</div>
                <div className='company-industry'>{currentCompany.industry}</div>
              </div>
              <DownOutlined className='dropdown-icon' />
            </div>
          </Dropdown>
        )}

        {/* Menu */}
        <Menu
          mode='inline'
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className='navigation-menu'
          inlineIndent={20}
        />

      </div>
    </Sider>
  );
}
