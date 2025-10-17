import { Router } from 'express';
import {
  createCollectionRoute,
  listCollectionRoutes,
  getCollectionRoute,
  updateCollectionRoute,
  deleteCollectionRoute,
} from '../controllers/CollectionRouteController.js';

const router = Router();

router.post('/', createCollectionRoute);
router.get('/', listCollectionRoutes);
router.get('/:id', getCollectionRoute);
router.put('/:id', updateCollectionRoute);
router.delete('/:id', deleteCollectionRoute);

export default router;
