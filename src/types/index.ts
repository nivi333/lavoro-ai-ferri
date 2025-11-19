// Common interfaces for API responses and data structures

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CreateCompanyData {
  name: string;
  slug?: string;
  industry: string;
  country: string;
  contactInfo: string; // emailOrPhone format
  establishedDate: Date;
  businessType: string;
  defaultLocation: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  certifications?: string[];
}

export interface CreateLocationData {
  name: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  locationType?: 'BRANCH' | 'WAREHOUSE' | 'FACTORY' | 'STORE';
  isHeadquarters?: boolean;
}

export interface UpdateLocationData {
  name?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  locationType?: 'BRANCH' | 'WAREHOUSE' | 'FACTORY' | 'STORE';
  isHeadquarters?: boolean;
  isActive?: boolean;
}
