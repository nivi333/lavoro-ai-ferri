import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Loader2 } from 'lucide-react';
import useAuth from '@/contexts/AuthContext';
import { PrimaryButton } from '@/components/globalComponents';
import { BrandLogo } from '@/components/BrandLogo';
import { CompanyCreationSheet } from '@/components/company/CompanyCreationSheet';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/auth';
import { toast } from 'sonner';

export default function CompaniesListPage() {
  const { companies, switchCompany, isLoading, logout, refreshCompanies } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'owner' | 'roles'>('owner');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lazyLoading, setLazyLoading] = useState(true);

  // Lazy loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLazyLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSheetClose = () => setSheetOpen(false);

  const handleCompanyCreated = async () => {
    setSheetOpen(false);
    try {
      await refreshCompanies();
    } catch (error) {
      console.error('Error refreshing companies:', error);
      toast.warning('Company created but failed to refresh list. Please refresh the page.');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      await companyService.acceptInvitation(invitationId);
      toast.success('Invitation accepted successfully!');
      await refreshCompanies();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const ownerCompanies = companies?.filter(c => c.role === 'OWNER') || [];
  const roleCompanies = companies?.filter(c => c.role !== 'OWNER') || [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'blue';
      case 'ADMIN':
        return 'purple';
      case 'MANAGER':
        return 'green';
      case 'EMPLOYEE':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (isLoading || lazyLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-muted-foreground'>Loading companies...</p>
        </div>
      </div>
    );
  }

  const handleCompanySelect = async (company: Company) => {
    setLoading(true);
    try {
      await switchCompany(company);
      toast.success('Company switched successfully');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch company';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutLoading(true);
    setTimeout(() => {
      try {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
      } catch (error) {
        toast.error('Logout failed');
      } finally {
        setLogoutLoading(false);
      }
    }, 300);
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Top Bar */}
      <div className='border-b bg-card'>
        <div className='px-6 py-4 flex items-center justify-between w-full'>
          <BrandLogo width={70} height={60} />
          <div className='flex items-center gap-3'>
            <PrimaryButton size='sm' onClick={() => setSheetOpen(true)}>
              Add Company
            </PrimaryButton>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className='px-4 py-2 text-sm font-medium text-destructive border border-destructive rounded-md hover:bg-destructive/10 disabled:opacity-50'
            >
              {logoutLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='px-6 py-8 w-full'>
        <div className='w-full'>
          <h1 className='flex justify-center items-center gap-2 text-heading-3 font-heading font-semibold mb-4'>
            Select Company
          </h1>

          {companies && companies.length > 0 ? (
            <>
              <div className='flex justify-center gap-2 mb-4 border-b'>
                <button
                  onClick={() => setActiveTab('owner')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'owner'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Owner Companies
                </button>
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'roles'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Role-Based Access
                </button>
              </div>

              {/* Companies List */}
              <div className='max-w-4xl mx-auto'>
                {(activeTab === 'owner' ? ownerCompanies : roleCompanies).length === 0 ? (
                  <div className='text-center py-12 text-muted-foreground'>No companies found</div>
                ) : (
                  <ul className='space-y-2'>
                    {(activeTab === 'owner' ? ownerCompanies : roleCompanies).map(company => (
                      <li
                        key={company.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-primary/50 bg-card ${
                          loading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                        onClick={() => !loading && handleCompanySelect(company)}
                      >
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold border'>
                            {company.logoUrl ? (
                              <img
                                src={company.logoUrl}
                                alt={company.name}
                                className='w-full h-full rounded-full object-cover'
                              />
                            ) : (
                              company.name.charAt(0)
                            )}
                          </div>
                          <div className='font-medium text-base'>{company.name}</div>
                        </div>
                        <div className='flex items-center gap-3'>
                          {company.industry && (
                            <span className='text-sm text-muted-foreground'>
                              {company.industry}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded bg-${getRoleColor(company.role)}-500 text-white`}
                          >
                            {company.role}
                          </span>
                          {company.status === 'PENDING' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleAcceptInvitation(company.invitationId!);
                              }}
                              className='px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90'
                            >
                              Accept
                            </button>
                          )}
                          <Users className='h-5 w-5 text-muted-foreground' />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className='text-center py-12'>
              <Building2 className='h-16 w-16 mx-auto text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>No companies yet</p>
              <p className='text-sm text-muted-foreground mb-4'>
                Get started by creating your first company
              </p>
              <PrimaryButton onClick={() => setSheetOpen(true)}>Add Company</PrimaryButton>
            </div>
          )}
        </div>
      </div>

      <CompanyCreationSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
}
