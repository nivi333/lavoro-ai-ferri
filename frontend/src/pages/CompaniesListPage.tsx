import { useState, useEffect } from 'react';
import { Button, Typography, message, Modal, Spin, Badge } from 'antd';
import { ExclamationCircleOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuth from '../contexts/AuthContext';
import { CompanyCreationDrawer } from '../components/CompanyCreationDrawer';
import HeadingText from '../components/ui/HeadingText';
import { GradientButton } from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { companyService } from '../services/companyService';
import './CompaniesListPage.scss';
import { COMPANY_TEXT } from '../constants/company';
import { Company } from '../types/auth';

export default function CompaniesListPage() {
  const { companies, switchCompany, isLoading, logout, refreshCompanies } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'owner' | 'roles'>('owner');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lazyLoading, setLazyLoading] = useState(true);

  // Lazy loading effect - show loading for 2-3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLazyLoading(false);
    }, 2500); // 2.5 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const handleDrawerClose = () => setDrawerOpen(false);
  const handleCompanyCreated = async () => {
    setDrawerOpen(false);
    // Refresh the companies list after successful company creation
    try {
      await refreshCompanies();
    } catch (error) {
      console.error('Error refreshing companies:', error);
      message.warning('Company created but failed to refresh list. Please refresh the page.');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      // TODO: Implement accept invitation API call
      await companyService.acceptInvitation(invitationId);
      message.success('Invitation accepted successfully!');
      await refreshCompanies();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      message.error(error.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  // Filter companies by role
  const ownerCompanies = companies?.filter(c => c.role === 'OWNER') || [];
  const roleCompanies = companies?.filter(c => c.role !== 'OWNER') || [];

  // Role color mapping for ribbons
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '#1890ff'; // Blue
      case 'ADMIN':
        return '#722ed1'; // Purple
      case 'MANAGER':
        return '#52c41a'; // Green
      case 'EMPLOYEE':
        return '#fa8c16'; // Orange
      default:
        return '#d9d9d9'; // Gray
    }
  };

  if (isLoading || lazyLoading) {
    return (
      <div className='companies-loading'>
        <Spin size='large' tip={COMPANY_TEXT.LOADING_COMPANIES} />
      </div>
    );
  }

  const handleCompanySelect = async (company: Company) => {
    setLoading(true);
    try {
      await switchCompany(company);
      message.success(COMPANY_TEXT.COMPANY_SWITCHED_SUCCESS);
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : COMPANY_TEXT.SWITCH_COMPANY_ERROR;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: COMPANY_TEXT.LOGOUT_CONFIRM_TITLE,
      icon: <ExclamationCircleOutlined />,
      content: COMPANY_TEXT.LOGOUT_CONFIRM_CONTENT,
      okText: COMPANY_TEXT.LOGOUT_CONFIRM_OK,
      okType: 'danger',
      cancelText: COMPANY_TEXT.LOGOUT_CONFIRM_CANCEL,
      onOk() {
        return new Promise(resolve => {
          setLogoutLoading(true);
          setTimeout(() => {
            try {
              logout();
              message.success(COMPANY_TEXT.LOGGED_OUT_SUCCESS);
              navigate('/login');
              resolve(true);
            } catch (error) {
              message.error(COMPANY_TEXT.LOGOUT_ERROR);
            } finally {
              setLogoutLoading(false);
            }
          }, 300); // Small delay to show loading state
        });
      },
      onCancel() {
        // User cancelled, do nothing
      },
    });
  };

  // Layout
  return (
    <div className='companies-root'>
      <div className='companies-top-bar'>
        {/* <BrandLogo width={150} height={36} /> */}
        <BrandLogo width={150} height={36} />
        <div className='companies-top-bar-actions'>
          <GradientButton
            type='primary'
            className='companies-add-btn'
            onClick={() => setDrawerOpen(true)}
          >
            {COMPANY_TEXT.ADD_COMPANY}
          </GradientButton>
          <Button
            type='default'
            danger
            loading={logoutLoading}
            onClick={handleLogout}
            disabled={logoutLoading}
            style={{ height: '40px' }}
          >
            {COMPANY_TEXT.LOGOUT}
          </Button>
        </div>
      </div>
      <div className='companies-content'>
        <div className='companies-inner-wrapper'>
          <HeadingText>{COMPANY_TEXT.PAGE_TITLE}</HeadingText>
          {companies && companies.length > 0 ? (
            <>
              <div className='companies-tabs'>
                <div
                  className={`companies-tab${activeTab === 'owner' ? ' active' : ''}`}
                  onClick={() => setActiveTab('owner')}
                >
                  {COMPANY_TEXT.OWNER_TAB}
                </div>
                <div
                  className={`companies-tab${activeTab === 'roles' ? ' active' : ''}`}
                  onClick={() => setActiveTab('roles')}
                >
                  {COMPANY_TEXT.ROLES_TAB}
                </div>
              </div>
              <div className='companies-list'>
                {(activeTab === 'owner' ? ownerCompanies : roleCompanies).length === 0 ? (
                  <div className='companies-empty'>{COMPANY_TEXT.NO_COMPANIES_FOUND}</div>
                ) : (
                  <ul className='companies-list-ul'>
                    {(activeTab === 'owner' ? ownerCompanies : roleCompanies).map(company => (
                      <li
                        key={company.id}
                        className={`companies-card${loading ? ' loading' : ''}`}
                        onClick={() => !loading && handleCompanySelect(company)}
                        style={{ pointerEvents: loading ? 'none' : 'auto' }}
                      >
                        <div className='companies-card-left'>
                          <div>
                            <div className='companies-card-title'>
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt={`${company.name} logo`}
                                  className='companies-card-icon companies-card-logo'
                                />
                              ) : (
                                <BankOutlined className='companies-card-icon' />
                              )}
                              <Typography.Text className='companies-card-company-name'>
                                {company.name}
                              </Typography.Text>
                            </div>
                          </div>
                        </div>
                        <div className='companies-card-icon-industry'>
                          <span className='companies-card-industry'>{company.industry}</span>
                          <Badge
                            color={getRoleColor(company.role)}
                            text={company.role}
                            style={{
                              margin: '0 8px',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          />
                          {company.status === 'PENDING' && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <GradientButton
                                size="small"
                                onClick={() => handleAcceptInvitation(company.invitationId!)}
                                style={{ marginLeft: 8, fontSize: '11px', padding: '2px 8px' }}
                              >
                                Accept
                              </GradientButton>
                            </div>
                          )}
                          <TeamOutlined className='companies-card-team' />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className='companies-empty-state'>
              <BankOutlined className='companies-empty-icon' />
              <div className='companies-empty-text'>{COMPANY_TEXT.NO_COMPANY_CREATED}</div>
            </div>
          )}
        </div>
      </div>
      <CompanyCreationDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
}
