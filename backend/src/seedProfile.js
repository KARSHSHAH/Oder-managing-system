require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('./models/BusinessProfile');

async function seedProfile() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/oms');
    console.log('Connected to DB');
    const data = {
      businessName: 'Sagar Hosiery',
      address: '607/33, Mahavir Cloth Market, Opp. Old Railway Station, Kalupur, Ahmedabad - 380002, Gujarat',
      gstin: '24AQXPS1617G1Z1',
      state: 'Gujarat',
      phone: '079-22125218, 9898523260, 9429133531',
      email: 'swatilkshah@gmail.com',
      invoicePrefix: 'INV-'
    };

    const existing = await BusinessProfile.findOne();
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      console.log('Profile updated.');
    } else {
      await BusinessProfile.create(data);
      console.log('Profile created.');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedProfile();
