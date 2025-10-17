const BillingService = require('../services/BillingService');

async function generateBill(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { period } = req.body || {};
    const data = await BillingService.generateBillForPeriod({
      userId: req.user.id,
      period,
    });
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function getBill(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { id } = req.params;
    const data = await BillingService.getBillById({
      billId: id,
      userId: req.user.id,
    });
    return res.json(data);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
}

module.exports = {
  generateBill,
  getBill,
};
