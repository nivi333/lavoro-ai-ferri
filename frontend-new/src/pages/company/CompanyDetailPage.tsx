import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Edit, Globe, Mail, MapPin, Phone, Loader2 } from 'lucide-react';
import useAuth from '@/contexts/AuthContext';
import { PrimaryButton, SecondaryButton } from '@/components/globalComponents';
import { CompanyCreationSheet } from '@/components/company/CompanyCreationSheet';
import { companyService, CompanyDetails } from '@/services/companyService';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
    return <span className='text-muted-foreground'>-</span>;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return <span className='text-muted-foreground'>-</span>;
  }

  return value;
};

export default function CompanyDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { currentCompany, companies, refreshCompanies } = useAuth();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDetails | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  const effectiveTenantId = tenantId || currentCompany?.id;

  const company = companies?.find(c => c.id === effectiveTenantId);
  const extendedCompany: ExtendedCompany = {
    id: company?.id || '',
    name: company?.name || '',
    slug: company?.slug,
    industry: company?.industry,
    logoUrl: company?.logoUrl,
    role: company?.role,
    country: company?.country,
    description: company?.description,
    defaultLocation: company?.defaultLocation,
    addressLine1: company?.addressLine1,
    addressLine2: company?.addressLine2,
    city: company?.city,
    state: company?.state,
    pincode: company?.pincode,
    contactInfo: company?.contactInfo,
    website: company?.website,
    businessType: company?.businessType,
    establishedDate: company?.establishedDate,
    taxId: company?.taxId,
    isActive: company?.isActive,
  };

  useEffect(() => {
    if (effectiveTenantId) {
      setLoadingLogo(true);
      companyService
        .getCompanyLogo(effectiveTenantId)
        .then(url => setLogoUrl(url))
        .catch(err => console.error('Failed to load logo:', err))
        .finally(() => setLoadingLogo(false));
    }
  }, [effectiveTenantId]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleEditCompany = async () => {
    if (!effectiveTenantId) return;

    setLoadingCompany(true);
    try {
      const details = await companyService.getCompany(effectiveTenantId);
      setEditingCompany(details);
      setSheetOpen(true);
    } catch (error) {
      console.error('Failed to load company details:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingCompany(null);
  };

  const handleCompanyUpdated = async () => {
    await refreshCompanies();
    setSheetOpen(false);
    setEditingCompany(null);
  };

  const isActive = extendedCompany.isActive !== false;

  // Parse contact info
  const rawContactInfo = extendedCompany.contactInfo || '';
  const inferredEmail =
    rawContactInfo.includes('@') && !rawContactInfo.startsWith('{') ? rawContactInfo : undefined;
  const inferredPhone =
    !rawContactInfo.includes('@') && !rawContactInfo.startsWith('{') && rawContactInfo
      ? rawContactInfo
      : undefined;
  const website = extendedCompany.website;
  const websiteNode = website ? (
    <a
      href={website.startsWith('http') ? website : `https://${website}`}
      target='_blank'
      rel='noreferrer'
      className='text-primary hover:underline'
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

  const profileSections: ProfileSection[] = [
    {
      key: 'company-information',
      title: 'Company Information',
      items: [
        { label: 'Industry', value: extendedCompany.industry },
        { label: 'Country', value: extendedCompany.country },
        {
          label: 'Primary Contact',
          value: (
            <>
              {inferredEmail && <div>{inferredEmail}</div>}
              {inferredPhone && <div>{inferredPhone}</div>}
            </>
          ),
        },
        { label: 'Website', value: websiteNode },
      ],
    },
    {
      key: 'address',
      title: 'Address',
      items: [
        { label: 'Default Location', value: extendedCompany.defaultLocation },
        { label: 'Address Line 1', value: extendedCompany.addressLine1 },
        { label: 'Address Line 2', value: extendedCompany.addressLine2 },
        { label: 'City', value: extendedCompany.city },
        { label: 'State', value: extendedCompany.state },
        { label: 'Pincode', value: extendedCompany.pincode },
      ],
    },
    {
      key: 'business-details',
      title: 'Business Details',
      items: [
        { label: 'Established Date', value: formattedRegistrationDate },
        { label: 'Business Type', value: extendedCompany.businessType },
      ],
    },
    {
      key: 'tax-information',
      title: 'Tax Information',
      items: [{ label: 'Tax ID', value: extendedCompany.taxId }],
    },
  ];

  const contactPills = [
    locationDisplay && {
      icon: <MapPin className='h-4 w-4' />,
      text: locationDisplay,
    },
    inferredEmail && {
      icon: <Mail className='h-4 w-4' />,
      text: inferredEmail,
    },
    inferredPhone && {
      icon: <Phone className='h-4 w-4' />,
      text: inferredPhone,
    },
    websiteNode && {
      icon: <Globe className='h-4 w-4' />,
      text: websiteNode,
    },
  ].filter(Boolean) as { icon: ReactNode; text: ReactNode }[];

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-semibold'>Company Profile</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              An overview of your company information and registrations
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <SecondaryButton onClick={handleBack}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Dashboard
            </SecondaryButton>
            <PrimaryButton
              onClick={handleEditCompany}
              disabled={loadingCompany || extendedCompany?.role === 'EMPLOYEE'}
            >
              {loadingCompany ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Edit className='h-4 w-4 mr-2' />
              )}
              Edit
            </PrimaryButton>
          </div>
        </div>

        {/* Profile Card */}
        <Card className='p-6'>
          {/* Company Overview */}
          <div className='flex items-start gap-6 mb-6'>
            <div className='relative'>
              {loadingLogo ? (
                <div className='w-24 h-24 rounded-full bg-muted flex items-center justify-center'>
                  <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <div className='w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-3xl border-4 border-background shadow-lg'>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={extendedCompany.name}
                      className='w-full h-full rounded-full object-cover'
                    />
                  ) : (
                    <Building2 className='h-12 w-12' />
                  )}
                </div>
              )}
            </div>
            <div className='flex-1'>
              <h2 className='text-2xl font-semibold mb-2'>{extendedCompany.name}</h2>
              <div className='flex items-center gap-2 mb-3'>
                {extendedCompany.industry && (
                  <Badge variant='secondary'>{extendedCompany.industry}</Badge>
                )}
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                {extendedCompany.role && <Badge variant='outline'>{extendedCompany.role}</Badge>}
              </div>
              {contactPills.length > 0 && (
                <div className='flex flex-wrap gap-4'>
                  {contactPills.map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-sm text-muted-foreground'
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {extendedCompany.slug && (
              <div className='text-right'>
                <p className='text-sm text-muted-foreground mb-1'>Company Code</p>
                <p className='text-lg font-mono font-semibold'>
                  {extendedCompany.slug.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          <Separator className='my-6' />

          {/* Profile Sections */}
          {profileSections.map(section => (
            <div key={section.key} className='mb-8 last:mb-0'>
              <h3 className='text-lg font-semibold mb-4'>{section.title}</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                {section.items.map(item => (
                  <div key={`${section.key}-${item.label}`}>
                    <p className='text-sm text-muted-foreground mb-1'>{item.label}</p>
                    <p className='text-sm font-medium'>{getDisplayValue(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Separator className='my-6' />

          {/* Notes Section */}
          <div>
            <h3 className='text-lg font-semibold mb-4'>Notes</h3>
            <Card className='bg-muted/50 border-0 p-4'>
              <p className='text-sm text-muted-foreground'>
                {extendedCompany.description?.trim().length
                  ? extendedCompany.description
                  : 'No notes have been added for this company yet.'}
              </p>
            </Card>
          </div>
        </Card>
      </div>

      <CompanyCreationSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        mode='edit'
        companyId={effectiveTenantId}
        initialData={editingCompany ?? undefined}
        onCompanyUpdated={handleCompanyUpdated}
      />
    </div>
  );
}
