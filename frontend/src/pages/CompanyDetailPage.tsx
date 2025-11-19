import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  message,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  EditOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../contexts/AuthContext';
import { MainLayout } from '../components/layout';
import { CompanyCreationDrawer } from '../components/CompanyCreationDrawer';
import { companyService, CompanyDetails } from '../services/companyService';
import './CompanyDetailPage.scss';

const { Title, Text } = Typography;

interface ExtendedCompany {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  logoUrl?: string;
  role?: string;
  country?: string;
  description?: string;
  defaultLocation?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactInfo?: string;
  website?: string;
  phone?: string;
  documentsEmailRecipient?: string;
  businessType?: string;
  defaultEngagementType?: string;
  registrationType?: string;
  registrationNumber?: string;
  establishedDate?: string;
  timeZone?: string;
  currency?: string;
  taxId?: string;
  taxRegistered?: boolean;
  taxRegistrationNumber?: string;
  taxRegistrationDate?: string;
  notes?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

type SectionItem = {
  label: string;
  value?: ReactNode;
};

type ProfileSection = {
  key: string;
  title: string;
  items: SectionItem[];
};

const getDisplayValue = (value?: ReactNode) => {
  if (value === null || value === undefined) {
    return <span className='profile-info-empty'>-</span>;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return <span className='profile-info-empty'>-</span>;
  }

  return value;
};

export default function CompanyDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { currentCompany, companies, refreshCompanies } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDetails | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  // Fetch logo when component mounts or tenantId changes
  useEffect(() => {
    if (tenantId) {
      const fetchLogo = async () => {
        setLoadingLogo(true);
        try {
          const logo = await companyService.getCompanyLogo(tenantId);
          setLogoUrl(logo);
        } catch (error) {
          console.error('Failed to load company logo:', error);
        } finally {
          setLoadingLogo(false);
        }
      };
      fetchLogo();
    }
  }, [tenantId]);

  // Find the company details
  const company = useMemo(() => {
    if (!tenantId) return undefined;
    if (currentCompany && currentCompany.id === tenantId) {
      return currentCompany;
    }
    return companies?.find(c => c.id === tenantId);
  }, [tenantId, currentCompany, companies]);

  const extendedCompany = useMemo(() => (company || {}) as ExtendedCompany, [company]);

  useEffect(() => {
    if (!company) {
      message.error('Company not found');
      navigate('/companies');
    }
  }, [company, navigate]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleEditCompany = async () => {
    if (!tenantId) return;
    try {
      setLoadingCompany(true);
      const details = await companyService.getCompany(tenantId);
      setEditingCompany(details);
      setDrawerOpen(true);
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to load company details for editing';
      message.error(errMsg);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingCompany(null);
  };

  const handleCompanyUpdated = async (updated: CompanyDetails) => {
    message.success('Company details updated');
    setEditingCompany(updated);
    await refreshCompanies();
  };

  if (!company) {
    return (
      <div className='companies-loading'>
        <Spin size='large' tip='Loading company details...' />
      </div>
    );
  }

  const isActive = extendedCompany.isActive !== false;

  const contactInfo = extendedCompany.contactInfo || '';
  const inferredEmail = extendedCompany.documentsEmailRecipient
    || (contactInfo.includes('@') ? contactInfo : undefined);
  const inferredPhone = extendedCompany.phone
    || (!contactInfo.includes('@') && contactInfo ? contactInfo : undefined);
  const website = extendedCompany.website;
  const websiteNode = website ? (
    <a href={website.startsWith('http') ? website : `https://${website}`}
      target='_blank'
      rel='noreferrer'
      className='profile-link'
    >
      {website.replace(/^https?:\/\//, '')}
    </a>
  ) : undefined;

  const locationParts = [
    extendedCompany.defaultLocation,
    extendedCompany.city,
    extendedCompany.state,
    extendedCompany.country,
  ].filter(Boolean);
  const locationDisplay = locationParts.length ? locationParts.join(', ') : undefined;

  const registrationDate = extendedCompany.establishedDate
    ? new Date(extendedCompany.establishedDate)
    : undefined;
  const formattedRegistrationDate = registrationDate
    ? registrationDate.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : undefined;

  const taxRegisteredText = extendedCompany.taxRegistered === undefined
    ? undefined
    : extendedCompany.taxRegistered
      ? 'Yes'
      : 'No';

  const profileSections: ProfileSection[] = [
    {
      key: 'company-information',
      title: 'Company Information',
      items: [
        { label: 'Industry', value: extendedCompany.industry },
        { label: 'Country', value: extendedCompany.country },
        { label: 'Primary Contact', value: inferredEmail || inferredPhone },
        { label: 'Role', value: extendedCompany.role },
      ],
    },
    {
      key: 'general',
      title: 'General',
      items: [
        { label: 'Default Location Name', value: extendedCompany.defaultLocation },
        { label: 'Business Type', value: extendedCompany.businessType },
        { label: 'Time Zone', value: extendedCompany.timeZone },
        { label: 'Documents Email Recipient', value: extendedCompany.documentsEmailRecipient },
      ],
    },
    {
      key: 'registration',
      title: 'Registration Information',
      items: [
        { label: 'Registration Type', value: extendedCompany.registrationType || extendedCompany.businessType },
        { label: 'Default Engagement Type', value: extendedCompany.defaultEngagementType },
        { label: 'Registration Number', value: extendedCompany.registrationNumber || extendedCompany.taxId },
        { label: 'Registration Date', value: formattedRegistrationDate },
      ],
    },
    {
      key: 'tax',
      title: 'Tax Information',
      items: [
        { label: 'Tax Registered', value: taxRegisteredText },
        { label: 'Tax Registration Number', value: extendedCompany.taxRegistrationNumber || extendedCompany.taxId },
        { label: 'Registered Date', value: extendedCompany.taxRegistrationDate },
        { label: 'Company Currency', value: extendedCompany.currency },
      ],
    },
  ];

  const contactPills = [
    locationDisplay && {
      icon: <EnvironmentOutlined />,
      text: locationDisplay,
    },
    inferredEmail && {
      icon: <MailOutlined />,
      text: inferredEmail,
    },
    inferredPhone && {
      icon: <PhoneOutlined />,
      text: inferredPhone,
    },
    websiteNode && {
      icon: <GlobalOutlined />,
      text: websiteNode,
    },
  ].filter(Boolean) as { icon: ReactNode; text: ReactNode }[];

  return (
    <MainLayout>
      <div className='company-detail-page'>
        <div className='company-detail-top'>
          <div>
            <Title level={3} className='company-detail-title'>Company Profile</Title>
            <Text type='secondary'>An overview of your company information and registrations</Text>
          </div>
          <Space size={8} wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className='ghost-button'>
              Back to Dashboard
            </Button>
            <Button
              type='primary'
              icon={<EditOutlined />}
              onClick={handleEditCompany}
              loading={loadingCompany}
              disabled={loadingCompany}
            >
              Edit
            </Button>
          </Space>
        </div>

        <Card className='company-profile-card' bodyStyle={{ padding: 24 }}>
          <div className='company-profile-overview'>
            <Space size={20} align='start'>
              <Avatar
                size={96}
                src={logoUrl}
                className='company-profile-avatar'
                icon={<BankOutlined />}
              >
                {extendedCompany.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div className='company-profile-meta'>
                <Title level={4} className='company-profile-name'>{extendedCompany.name}</Title>
                <div className='company-profile-tags'>
                  {extendedCompany.industry && <Tag>{extendedCompany.industry}</Tag>}
                  <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
                  {extendedCompany.role && <Tag>{extendedCompany.role}</Tag>}
                </div>
                {contactPills.length > 0 && (
                  <div className='company-profile-contact'>
                    {contactPills.map(item => (
                      <Space key={String(item.text)} size={8} className='company-profile-contact-item'>
                        {item.icon}
                        <span>{item.text}</span>
                      </Space>
                    ))}
                  </div>
                )}
              </div>
            </Space>
            {extendedCompany.slug && (
              <div className='company-profile-code'>
                <Text type='secondary'>Company Code</Text>
                <div className='company-profile-code-value'>{extendedCompany.slug.toUpperCase()}</div>
              </div>
            )}
          </div>

          <Divider />

          {profileSections.map(section => (
            <div key={section.key} className='profile-section'>
              <div className='profile-section-title'>{section.title}</div>
              <Row gutter={[24, 24]}>
                {section.items.map(item => (
                  <Col key={`${section.key}-${item.label}`} xs={24} sm={12} lg={6}>
                    <div className='profile-info-item'>
                      <span className='profile-info-label'>{item.label}</span>
                      <span className='profile-info-value'>{getDisplayValue(item.value)}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ))}

          <div className='profile-section'>
            <div className='profile-section-title'>Notes</div>
            <Card className='profile-notes-card' bordered={false} size='small'>
              <Text className='profile-notes-text'>
                {extendedCompany.description?.trim().length
                  ? extendedCompany.description
                  : 'No notes have been added for this company yet.'}
              </Text>
            </Card>
          </div>
        </Card>
      </div>
      <CompanyCreationDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode='edit'
        companyId={tenantId}
        initialData={editingCompany ?? undefined}
        onCompanyUpdated={handleCompanyUpdated}
      />
    </MainLayout>
  );
}
