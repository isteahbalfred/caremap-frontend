import { Request, Response, NextFunction } from 'express';
import { PharmacyService } from './pharmacies.service';

const pharmacyService = new PharmacyService();

export class PharmacyController {
  // GET /api/v1/pharmacies
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const city = req.query.city as string;
      const department = req.query.department as string;
      const clinicId = req.query.clinicId as string;
      const result = await pharmacyService.findAll({ page, limit, search, city, department, clinicId });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/pharmacies/:id
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pharmacy = await pharmacyService.findById(req.params.id);
      res.json({ success: true, data: pharmacy });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/pharmacies
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const pharmacy = await pharmacyService.create({
        ...req.body,
        adminId: user.id,
      });
      res.status(201).json({
        success: true,
        message: 'Pharmacie créée avec succès. En attente de validation.',
        data: pharmacy,
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/v1/pharmacies/:id
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const pharmacy = await pharmacyService.update(
        req.params.id,
        user.id,
        req.body
      );
      res.json({
        success: true,
        message: 'Pharmacie mise à jour',
        data: pharmacy,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/pharmacies/my/dashboard
  dashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await pharmacyService.getDashboard(user.id);
      res.json({ success: true, data });
    } catch (error) {
      // Cas normal pour un pharmacien qui n'a pas encore créé sa pharmacie :
      // on renvoie hasPharmacy: false plutôt qu'une 404 brute, pour que le
      // frontend puisse afficher le formulaire de création proprement.
      if ((error as any)?.statusCode === 404 || (error as any)?.message === 'Pharmacie introuvable') {
        return res.json({ success: true, data: { hasPharmacy: false } });
      }
      next(error);
    }
  };
}
