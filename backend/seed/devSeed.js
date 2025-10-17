const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Municipality = require('../models/Municipality');
const User = require('../models/User');
const CollectionData = require('../models/CollectionData');
const WasteSubmission = require('../models/WasteSubmission');

dotenv.config();

async function seed() {
  await connectDB();

  const municipalityId = new mongoose.Types.ObjectId('65f9b8aa12f44b9a9b0a5678');
  const userId = new mongoose.Types.ObjectId('65f9b1e7b2f44b9a9b0a1234');
  const period = '2025-09';

  await Municipality.findOneAndUpdate(
    { _id: municipalityId },
    {
      _id: municipalityId,
      name: 'Colombo District',
      billingModel: 'weight',
      fixedRate: 1000,
      weightRatePerKg: 10,
      defaultRate: 1200,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { _id: userId },
    {
      _id: userId,
      name: 'JD',
      email: 'jjayawardene610@gmail.com',
      address: {
        line1: '120 A, Galle Road, Colombo',
        city: 'Colombo',
        postal: '00500',
        municipalityId,
      },
      paymentMethods: ['card-visa-1234'],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await CollectionData.findOneAndUpdate(
    { userId, period },
    {
      userId,
      period,
      weightKg: 65,
      status: 'collected',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await WasteSubmission.deleteMany({ userId, period });
  await WasteSubmission.insertMany([
    {
      userId,
      type: 'special',
      period,
      feeOrCredit: 200,
      weightKg: 5,
    },
    {
      userId,
      type: 'recyclable',
      period,
      feeOrCredit: 500,
      weightKg: 18,
    },
  ]);

  console.log('Dev seed complete');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
