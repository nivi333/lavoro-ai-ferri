import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  BankOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { getNavigationByIndustry, type IndustryType } from '../../config/navigationConfig';
import './Sidebar.scss';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany, logout } = useAuth();
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  // Get navigation menu items based on company industry
  const menuItems = useMemo(() => {
    // Default to Textile Manufacturing if no company or industry
    const industry = (currentCompany?.industry as IndustryType) || 'Textile Manufacturing';
    const navigationItems = getNavigationByIndustry(industry);

    // Filter navigation items based on user role
    const userRole = currentCompany?.role;
    const filteredItems = navigationItems.filter(item => {
      // Users menu is only visible to OWNER, ADMIN, and MANAGER
      if (item.key === 'users') {
        return userRole && ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
      }
      return true; // Show all other items
    });

    // Convert navigation config to Ant Design Menu format
    return filteredItems.map(item => ({
      key: item.path,
      icon: <item.icon />,
      label: item.label,
      children: item.children?.map(child => ({
        key: child.path,
        icon: child.icon ? <child.icon /> : undefined,
        label: child.label,
      })),
    }));
  }, [currentCompany?.industry, currentCompany?.role]);

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
      // Redirect placeholder routes to dashboard
      const placeholderRoutes = ['/customers', '/reports', '/analytics'];
      if (placeholderRoutes.includes(key)) {
        navigate('/dashboard');
      } else {
        navigate(key);
      }
    }
  };

  const getSelectedKeys = () => {
    const path = location.pathname;

    // Find the exact matching menu item
    for (const item of menuItems) {
      // Check if it's a direct match
      if (item.key === path) {
        return [path];
      }

      // Check children for match
      if (item.children) {
        for (const child of item.children) {
          if (child.key === path) {
            return [path];
          }
        }
      }
    }

    // Default to dashboard if no match
    return ['/dashboard'];
  };

  const getOpenKeys = () => {
    const path = location.pathname;

    // Open Quality Control submenu if on quality or inspection pages
    if (path.includes('/quality') || path.includes('/inspections')) {
      return ['/quality'];
    }

    // Open Textile Operations submenu if on textile pages
    if (path.includes('/textile')) {
      return ['/textile'];
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
              <Avatar
                size={32}
                style={{ border: '1px solid #b3b3b3', padding: '2px' }}
                src={currentCompany.logoUrl}
              >
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
