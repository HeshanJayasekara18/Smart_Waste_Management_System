const express = require('express');
const {
  createCollectionRoute,
  listCollectionRoutes,
  getCollectionRoute,
  updateCollectionRoute,
  deleteCollectionRoute,
} = require('../controllers/CollectionRouteController');

const router = express.Router();

router.post('/', createCollectionRoute);
router.get('/', listCollectionRoutes);
router.get('/:id', getCollectionRoute);
router.put('/:id', updateCollectionRoute);
router.delete('/:id', deleteCollectionRoute);

module.exports = router;
