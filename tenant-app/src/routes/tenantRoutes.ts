import { Router } from 'express';
import TenantController from '../controllers/tenantController';

const router = Router();
const tenantController = new TenantController();

export function setTenantRoutes(app) {
  app.use('/tenants', router);

  router.post('/', tenantController.createTenant.bind(tenantController));
}