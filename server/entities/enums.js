export const UserRole = {
  REALTOR: 'REALTOR',
  TENANT: 'TENANT',
  ADMIN: 'ADMIN',
  GUEST: 'GUEST',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'USER',
};

export const AccountStatus = {
  INACTIVE: 'INACTIVE',
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

export const RealEstateType = {
  SINGLE_FAMILY_HOME: 'SINGLE_FAMILY_HOME',
  MULTI_FAMILY_HOME: 'MULTI_FAMILY_HOME',
  CONDO: 'CONDO',
  APARTMENT: 'APARTMENT',
  TOWNHOUSE: 'TOWNHOUSE',
  LUXURY: 'LUXURY',
  OFFICE: 'OFFICE',
  RETAIL: 'RETAIL',
  INDUSTRIAL: 'INDUSTRIAL',
  LAND: 'LAND',
  FARM: 'FARM',
};

export const ListingStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  RENTED: 'RENTED',
  NOT_RENTED: 'NOT_RENTED',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  PENDING: 'PENDING',
  UNKNOWN: 'UNKNOWN',
};

export const CurrencyCode = {
  USD: 'USD', CAD: 'CAD', EUR: 'EUR', GBP: 'GBP', AUD: 'AUD', NZD: 'NZD',
  JPY: 'JPY', CNY: 'CNY', INR: 'INR', RUB: 'RUB', BRL: 'BRL', CHF: 'CHF',
  KRW: 'KRW', MXN: 'MXN', SGD: 'SGD', TRY: 'TRY', NGN: 'NGN', PHP: 'PHP',
  SEK: 'SEK', ARS: 'ARS', NOK: 'NOK', DKK: 'DKK', ILS: 'ILS', CLP: 'CLP',
  COP: 'COP', ZAR: 'ZAR', HKD: 'HKD', TWD: 'TWD', PLN: 'PLN', THB: 'THB',
  IDR: 'IDR', HUF: 'HUF', CZK: 'CZK', AED: 'AED', SAR: 'SAR', MYR: 'MYR',
  RON: 'RON', PEN: 'PEN', KWD: 'KWD', QAR: 'QAR', CRC: 'CRC', DOP: 'DOP',
  HRK: 'HRK', HNL: 'HNL', ISK: 'ISK', PKR: 'PKR', EGP: 'EGP', XCD: 'XCD',
  MAD: 'MAD', OMR: 'OMR', BOB: 'BOB', LKR: 'LKR', BGN: 'BGN', BHD: 'BHD',
  VND: 'VND', UAH: 'UAH', IQD: 'IQD', JOD: 'JOD', BDT: 'BDT', KES: 'KES',
  UYU: 'UYU', AZN: 'AZN', LBP: 'LBP', DZD: 'DZD', UZS: 'UZS', TND: 'TND',
  GHS: 'GHS', BWP: 'BWP', TZS: 'TZS', BYN: 'BYN', KZT: 'KZT', RSD: 'RSD',
  TTD: 'TTD', UGX: 'UGX', AOA: 'AOA', COPPER: 'COPPER', XAU: 'XAU', XAG: 'XAG',
  XPD: 'XPD', XPT: 'XPT', XDR: 'XDR', XOF: 'XOF', XPF: 'XPF', XAF: 'XAF',
  XFU: 'XFU', XBA: 'XBA', XBB: 'XBB', XBC: 'XBC', XBD: 'XBD', XTS: 'XTS',
  XXX: 'XXX', ZMW: 'ZMW'
};

export const CivilStatus = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  SEPARATED: 'SEPARATED',
  OTHER: 'OTHER',
};

export const LeaseStatus = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
};

export const PaymentFrequency = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUALLY: 'ANNUALLY',
  WEEKLY: 'WEEKLY',
};

export const PaymentStatus = {
  PENDING: 'PENDING',
  REPORTED: 'REPORTED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
};

export const PaymentScheduleStatus = {
  SCHEDULED: 'SCHEDULED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  WAIVED: 'WAIVED',
};

export const TokenType = {
  API: 'API',
  EMAIL: 'EMAIL',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_CONFIRMATION: 'EMAIL_CONFIRMATION',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
};

export const ZonapropExposure = {
  SIMPLE: 'SIMPLE',
  DESTACADO: 'DESTACADO',
  SUPER_DESTACADO: 'SUPER_DESTACADO',
};

export const SyncStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

export const AmenityCategory = {
  RECREATIONAL: 'RECREATIONAL',
  TECHNICAL: 'TECHNICAL',
  SERVICE: 'SERVICE',
  SAFETY: 'SAFETY',
  OTHER: 'OTHER',
};

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const MaintenanceStatus = {
  REPORTED: 'REPORTED',
  OPEN: 'OPEN',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export const DocumentType = {
  LEASE: 'LEASE',
  APPLICATION: 'APPLICATION',
  OTHER: 'OTHER',
  INVOICE: 'INVOICE',
  REPORT: 'REPORT',
};
