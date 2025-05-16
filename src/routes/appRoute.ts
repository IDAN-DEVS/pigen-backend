import { Router } from 'express';
import { appController } from '../controllers/appController';

export const appRouter = Router();

appRouter.get('/', appController.getAppInfo);
