// Location Management Constants

export const LOCATION_TYPES = {
  BRANCH: 'BRANCH',
  WAREHOUSE: 'WAREHOUSE',
  FACTORY: 'FACTORY',
  STORE: 'STORE',
} as const;

export const LOCATION_TYPE_LABELS = {
  BRANCH: 'Branch',
  WAREHOUSE: 'Warehouse',
  FACTORY: 'Factory',
  STORE: 'Store',
} as const;

export const LOCATION_TYPE_COLORS = {
  BRANCH: '#52c41a', // Success green
  WAREHOUSE: '#faad14', // Warning orange
  FACTORY: '#1890ff', // Info blue
  STORE: '#7b5fc9', // Store purple
} as const;

export const LOCATION_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export const LOCATION_STATUS_COLORS = {
  ACTIVE: '#54b225ff',
  INACTIVE: '#ff4d4f',
} as const;

// Form validation messages
export const LOCATION_VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Location name is required',
  NAME_MIN_LENGTH: 'Location name must be at least 2 characters',
  NAME_MAX_LENGTH: 'Location name cannot exceed 100 characters',
  COUNTRY_REQUIRED: 'Country is required',
  ADDRESS_LINE_1_REQUIRED: 'Address line 1 is required',
  CITY_REQUIRED: 'City is required',
  STATE_REQUIRED: 'State is required',
  PINCODE_REQUIRED: 'Pincode is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PHONE_INVALID: 'Please enter a valid phone number',
  ONLY_ONE_DEFAULT: 'Only one location can be set as default',
  ONLY_ONE_HEADQUARTERS: 'Only one location can be set as headquarters',
} as const;

// Table configuration
export const LOCATION_TABLE_CONFIG = {
  PAGE_SIZE: 10,
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SCROLL_X: 1200,
} as const;

// Drawer configuration
export const LOCATION_DRAWER_CONFIG = {
  WIDTH: 720,
  PLACEMENT: 'right',
} as const;

// API endpoints
export const LOCATION_ENDPOINTS = {
  LOCATIONS: '/locations',
  LOCATION_BY_ID: (id: string) => `/locations/${id}`,
  SET_DEFAULT: (id: string) => `/locations/${id}/set-default`,
  SET_HEADQUARTERS: (id: string) => `/locations/${id}/set-headquarters`,
} as const;

// Empty state messages
export const LOCATION_EMPTY_STATE = {
  TITLE: 'No locations found',
  DESCRIPTION: 'Create your first location to get started with multi-location management',
  BUTTON_TEXT: 'Add Location',
} as const;

// Success messages
export const LOCATION_SUCCESS_MESSAGES = {
  CREATE: 'Location created successfully',
  UPDATE: 'Location updated successfully',
  DELETE: 'Location deleted successfully',
  SET_DEFAULT: 'Default location updated successfully',
  SET_HEADQUARTERS: 'Headquarters updated successfully',
} as const;

// Error messages
export const LOCATION_ERROR_MESSAGES = {
  FETCH_ERROR: 'Failed to fetch locations',
  CREATE_ERROR: 'Failed to create location',
  UPDATE_ERROR: 'Failed to update location',
  DELETE_ERROR: 'Failed to delete location',
  SET_DEFAULT_ERROR: 'Failed to set default location',
  SET_HEADQUARTERS_ERROR: 'Failed to set headquarters',
  NETWORK_ERROR: 'Network error. Please check your connection',
} as const;
