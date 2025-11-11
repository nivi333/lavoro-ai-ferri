import { useState } from 'react';
import { Button, Tabs, message } from 'antd';
import { TeamOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Company } from '../types/auth';
import { BrandLogo } from '../components/BrandLogo';
import { HeadingText } from '../components/ui';
import './CompaniesListPage.scss';

// Companies selection page component
import { Spin } from 'antd';

export function CompaniesListPage() {
  const { companies, user, switchCompany, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'owner' | 'roles'>('owner');

  // Filter companies by role
  const ownerCompanies = companies?.filter(c => c.role === 'OWNER') || [];
  const roleCompanies = companies?.filter(c => c.role !== 'OWNER') || [];

  if (isLoading) {
    return (
      <div className='companies-loading'>
        <Spin size='large' tip='Loading...' />
      </div>
    );
  }

  const handleCompanySelect = async (company: Company) => {
    setLoading(true);
    try {
      await switchCompany(company);
      message.success('Company switched successfully');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch company';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Layout
  return (
    <div className='companies-root'>
      <div className='companies-top-bar'>
        <BrandLogo width={150} height={36} />
        <div className='companies-top-bar-actions'>
          <Button
            type='primary'
            className='companies-add-btn'
            onClick={() => navigate('/company/create')}
          >
            Add Company
          </Button>
          <Button
            type='default'
            danger
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className='companies-content'>
        <div className='companies-inner-wrapper'>
          <HeadingText>Select Company / Role</HeadingText>
          {companies && companies.length > 0 ? (
            <>
              <div className='companies-tabs'>
                <div
                  className={`companies-tab${activeTab === 'owner' ? ' active' : ''}`}
                  onClick={() => setActiveTab('owner')}
                >
                  Owner
                </div>
                <div
                  className={`companies-tab${activeTab === 'roles' ? ' active' : ''}`}
                  onClick={() => setActiveTab('roles')}
                >
                  Roles
                </div>
              </div>
              <div className='companies-list'>
                {(activeTab === 'owner' ? ownerCompanies : roleCompanies).length === 0 ? (
                  <div className='companies-empty'>No companies found</div>
                ) : (
                  <ul className='companies-list-ul'>
                    {(activeTab === 'owner' ? ownerCompanies : roleCompanies).map(company => (
                      <li
                        key={company.id}
                        className='companies-card'
                        onClick={() => handleCompanySelect(company)}
                      >
                        <div className='companies-card-left'>
                          <div>
                            <div className='companies-card-title'>{company.name}</div>
                          </div>
                        </div>
                        <div className='companies-card-desc companies-card-desc-wrapper'>
                          {company.industry}{' '}
                          <span className='companies-card-desc-separator'>•</span> {company.role}
                        </div>
                        <TeamOutlined className='companies-card-team' />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className='companies-empty-state'>
              <BankOutlined className='companies-empty-icon' />
              <div className='companies-empty-text'>No company created</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
