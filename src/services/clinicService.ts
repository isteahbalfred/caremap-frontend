import api from './api';

/* ============================================================================
   Champs Prisma nécessaires côté backend pour exploiter ce service à 100% :

   model Clinic {
     id                String   @id @default(uuid())
     name              String
     description       String?
     email             String?
     phone             String?
     whatsapp          String?
     department        String        // département principal
     city              String        // ville principale
     address           String?
     latitude          Float?
     longitude         Float?
     services          String[]      @default([])
     additionalLocations Json?       // [{department, city, address, phone}]
     contract          Json?         // {type, startDate, endDate, notes}
     isValidated        Boolean       @default(false)
     isBlocked          Boolean       @default(false)
     adminId            String?
     admin              User?         @relation(fields: [adminId], references: [id])
     createdAt          DateTime      @default(now())
     updatedAt          DateTime      @updatedAt
   }

   Endpoints admin attendus (protégés, role SUPER_ADMIN) :
     GET    /admin/clinics
     POST   /admin/clinics
     PATCH  /admin/clinics/:id
     PATCH  /admin/clinics/:id/block      body: { isBlocked: boolean }
     DELETE /admin/clinics/:id
   ============================================================================ */

export type ClinicLocation = {
  department: string;
  city: string;
  address?: string;
  phone?: string;
};

export type ClinicContract = {
  type: 'GRATUIT' | 'STANDARD' | 'PREMIUM' | 'PARTENARIAT';
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type ClinicPayload = {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  department: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  additionalLocations?: ClinicLocation[];
  contract?: ClinicContract;
};

export const clinicService = {
  /* -------------------------- Public / recherche -------------------------- */
  getAll: (params: {
    search?: string;
    city?: string;
    department?: string;
    limit?: number;
    page?: number;
  }) => api.get('/clinics', { params }),

  getById: (id: string) => api.get(`/clinics/${id}`),

  /* -------------------------------- Admin --------------------------------- */
  adminGetAll: (params?: { search?: string; department?: string; city?: string }) =>
    api.get('/admin/clinics', { params }),

  create: (payload: ClinicPayload) => api.post('/admin/clinics', payload),

  update: (id: string, payload: Partial<ClinicPayload>) =>
    api.patch(`/admin/clinics/${id}`, payload),

  toggleBlock: (id: string, isBlocked: boolean) =>
    api.patch(`/admin/clinics/${id}/block`, { isBlocked }),

  remove: (id: string) => api.delete(`/admin/clinics/${id}`),
};

export default clinicService;