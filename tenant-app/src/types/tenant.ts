export interface Lease {
  unitId: number;
  startDate: string;
  endDate: string;
  rentalPrice: number;
  paymentFrequency: string;
  status: string;
}

export interface Tenant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unitId: number;
  lease: Lease;
}