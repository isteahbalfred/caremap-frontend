export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'PHARMACY_ADMIN' | 'CLINIC_ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
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
export interface DashboardStats {
  totalUsers: number;
  totalPharmacies: number;
  validatedPharmacies: number;
  pendingPharmacies: number;
  totalClinics: number;
  totalMedications: number;
}


export interface PendingPharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  admin: {
    firstName: string;
    lastName: string;
    email: string;
  };
}