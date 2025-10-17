import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import Municipality from '../models/Municipality.js';
import CollectionData from '../models/CollectionData.js';
import WasteSubmissionDummy from '../models/WasteSubmissionDummy.js';

function resolvePeriod(period) {
  if (period) {
    return period;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function computeBaseAmount({ municipality, collection, defaultRate }) {
  const weightKg = collection ? collection.weightKg : 0;
  const weightBasedAmount = weightKg * (municipality.weightRatePerKg || 0);
  const fixedAmount = municipality.fixedRate || defaultRate || 0;

  switch (municipality.billingModel) {
    case 'fixed':
      return { amount: fixedAmount || defaultRate || 0, model: 'fixed' };
    case 'user_choice': {
      const weightAmount = weightBasedAmount || defaultRate || 0;
      if (fixedAmount === 0) {
        return { amount: weightAmount, model: 'weight' };
      }
      if (weightAmount === 0) {
        return { amount: fixedAmount, model: 'fixed' };
      }
      return weightAmount <= fixedAmount
        ? { amount: weightAmount, model: 'weight' }
        : { amount: fixedAmount, model: 'fixed' };
    }
    case 'weight':
    default:
      return { amount: weightBasedAmount || defaultRate || 0, model: 'weight' };
  }
}

export async function generateBillForPeriod({ userId, period }) {
  const resolvedPeriod = resolvePeriod(period);
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user id');
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  const municipality = await Municipality.findById(user.address.municipalityId).lean();
  if (!municipality) {
    throw new Error('Municipality not found for user');
  }

  const [collection, submissions] = await Promise.all([
    CollectionData.findOne({ userId, period: resolvedPeriod }).lean(),
    WasteSubmissionDummy.find({ userId, period: resolvedPeriod }).lean(),
  ]);

  const defaultRate = municipality.defaultRate || municipality.fixedRate || 0;
  const baseInfo = computeBaseAmount({
    municipality,
    collection,
    defaultRate,
  });

  const extraFee = submissions
    .filter((item) => item.type === 'special')
    .reduce((sum, item) => sum + (item.feeOrCredit || 0), 0);

  const recyclingCredit = submissions
    .filter((item) => item.type === 'recyclable')
    .reduce((sum, item) => sum + Math.abs(item.feeOrCredit || 0), 0);

  const weightKg = collection ? collection.weightKg : 0;
  const base = baseInfo.amount;
  const totalAmount = Math.max(0, base + extraFee - recyclingCredit);
  const warning = collection ? '' : 'Collection data missing for this period';

  const existingBill = await Bill.findOne({ userId, period: resolvedPeriod });
  const status = existingBill && existingBill.status === 'paid' ? 'paid' : 'pending';

  await Bill.findOneAndUpdate(
    { userId, period: resolvedPeriod },
    {
      userId,
      municipalityId: municipality._id,
      period: resolvedPeriod,
      billingModelUsed: baseInfo.model,
      breakdown: {
        base,
        weightKg,
        extraFee,
        recyclingCredit,
      },
      amount: totalAmount,
      status,
      warning,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const bill = await Bill.findOne({ userId, period: resolvedPeriod }).lean();

  return {
    bill,
    user,
    municipality,
    collection,
    submissions,
  };
}

export async function getBillById({ billId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(billId)) {
    throw new Error('Invalid bill id');
  }

  const bill = await Bill.findOne({ _id: billId, userId }).lean();
  if (!bill) {
    throw new Error('Bill not found');
  }

  const [user, municipality, collection, submissions] = await Promise.all([
    User.findById(userId).lean(),
    Municipality.findById(bill.municipalityId).lean(),
    CollectionData.findOne({ userId, period: bill.period }).lean(),
    WasteSubmissionDummy.find({ userId, period: bill.period }).lean(),
  ]);

  return {
    bill,
    user,
    municipality,
    collection,
    submissions,
  };
}

