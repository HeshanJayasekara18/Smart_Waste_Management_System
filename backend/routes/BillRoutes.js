const express = require('express');
const BillController = require('../controllers/BillController');

const router = express.Router();

router.post('/generate', BillController.generateBill);
router.get('/:id', BillController.getBill);

module.exports = router;
