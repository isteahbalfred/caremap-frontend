export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'PHARMACY_ADMIN' | 'CLINIC_ADMIN' | 'SUPER_ADMIN';
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  description?: string;
  imageUrl?: string;
  category: Category;
  stocks: MedicationStock[];
}

export interface MedicationStock {
  id: string;
  quantity: number;
  price: number;
  threshold: number;
  isAvailable: boolean;
  pharmacy: PharmacySummary;
}

export interface PharmacySummary {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
}

export interface Pharmacy extends PharmacySummary {
  logoUrl?: string;
  isValidated: boolean;
  isActive: boolean;
  medications: MedicationStock[];
}

export interface Category {
  id: string;
  name: string;
}