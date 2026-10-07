const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const RetailParty = require('../models/RetailParty');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

dotenv.config({ path: require('path').join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/undergarments_oms';
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      RetailParty.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Cleared database. Creating Admin and Staff users...');

    // 1. Users
    const admin = await User.create({
      name: 'Owner Admin',
      email: 'admin@wholesale.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
      status: 'active',
    });

    const staff1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'rajesh@wholesale.com',
      phone: '9811122233',
      password: 'staff123',
      role: 'staff',
      areaAssigned: ['Central Market', 'North Zone'],
      status: 'active',
    });

    const staff2 = await User.create({
      name: 'Amit Verma',
      email: 'amit@wholesale.com',
      phone: '9822233344',
      password: 'staff123',
      role: 'staff',
      areaAssigned: ['South Market', 'East Extension'],
      status: 'active',
    });

    console.log('Users created. Creating Retail Parties...');

    // 2. Retail Parties
    const party1 = await RetailParty.create({
      partyName: 'Gupta Hosiery & Garments',
      ownerName: 'Sunil Gupta',
      shopAddress: 'Shop #14, Main Market, Sadar Bazaar',
      contactNo: '9899112233',
      altContactNo: '011-23456789',
      email: 'gupta.hosiery@example.com',
      gstNo: '07AAAAA0000A1Z5',
      panNo: 'ABCDE1234F',
      areaRoute: 'Central Market',
      creditLimit: 100000,
      openingBalance: 15000,
      currentBalance: 15000,
      status: 'active',
      loginId: 'RP1001',
      password: 'retail123',
      createdBy: admin._id,
    });

    const party2 = await RetailParty.create({
      partyName: 'Vikas Lingerie & Innerwear Hub',
      ownerName: 'Vikas Agarwal',
      shopAddress: 'Plot 45, Sector 18, Commercial Belt',
      contactNo: '9877665544',
      altContactNo: '',
      email: 'vikas.lingerie@example.com',
      gstNo: '07BBBBB1111B1Z6',
      panNo: 'FGHIJ5678K',
      areaRoute: 'North Zone',
      creditLimit: 75000,
      openingBalance: 5000,
      currentBalance: 5000,
      status: 'active',
      loginId: 'RP1002',
      password: 'retail123',
      createdBy: admin._id,
    });

    const party3 = await RetailParty.create({
      partyName: 'Shiv Shakti Undergarments',
      ownerName: 'Ramesh Patel',
      shopAddress: '12 Cloth Merchants Complex, Gandhi Chowk',
      contactNo: '9844556677',
      email: 'shivshakti@example.com',
      areaRoute: 'South Market',
      creditLimit: 50000,
      openingBalance: 0,
      currentBalance: 0,
      status: 'active',
      loginId: 'RP1003',
      password: 'retail123',
      createdBy: admin._id,
    });

    console.log('Parties created. Creating Products with flexible variants...');

    // 3. Products
    const prod1 = await Product.create({
      name: 'Lux Cozi Regular Ribbed Men Vest',
      brand: 'Lux Cozi',
      category: 'Vest',
      description: '100% super combed cotton men vest with breathable fabric.',
      variants: [
        { size: '80 cm', color: 'White', sku: 'LUX-VST-80-W', stockQty: 120, wholesaleRate: 72, mrp: 110, costPrice: 52 },
        { size: '85 cm', color: 'White', sku: 'LUX-VST-85-W', stockQty: 95, wholesaleRate: 75, mrp: 115, costPrice: 54 },
        { size: '90 cm', color: 'White', sku: 'LUX-VST-90-W', stockQty: 80, wholesaleRate: 78, mrp: 120, costPrice: 56 },
        { size: '95 cm', color: 'White', sku: 'LUX-VST-95-W', stockQty: 15, wholesaleRate: 82, mrp: 125, costPrice: 59 },
      ],
      isActive: true,
    });

    const prod2 = await Product.create({
      name: 'Amul Macho Classic Cotton Brief',
      brand: 'Amul Macho',
      category: 'Brief',
      description: 'Outer elastic waistband, multi-color assorted men briefs.',
      variants: [
        { size: 'Small (75cm)', color: 'Assorted', sku: 'MCH-BRF-S-AST', stockQty: 150, wholesaleRate: 60, mrp: 95, costPrice: 42 },
        { size: 'Medium (80cm)', color: 'Assorted', sku: 'MCH-BRF-M-AST', stockQty: 200, wholesaleRate: 64, mrp: 100, costPrice: 45 },
        { size: 'Large (85cm)', color: 'Assorted', sku: 'MCH-BRF-L-AST', stockQty: 180, wholesaleRate: 68, mrp: 105, costPrice: 48 },
        { size: 'XL (90cm)', color: 'Assorted', sku: 'MCH-BRF-XL-AST', stockQty: 8, wholesaleRate: 72, mrp: 110, costPrice: 51 }, // Low stock alert
      ],
      isActive: true,
    });

    const prod3 = await Product.create({
      name: 'Jockey Cotton Stretch Everyday Bra',
      brand: 'Jockey',
      category: 'Bra',
      description: 'Non-padded wire-free everyday bra with gentle support.',
      variants: [
        { size: '32B', color: 'Black', sku: 'JCK-BRA-32B-BLK', stockQty: 50, wholesaleRate: 280, mrp: 449, costPrice: 210 },
        { size: '34B', color: 'Skin', sku: 'JCK-BRA-34B-SKN', stockQty: 60, wholesaleRate: 280, mrp: 449, costPrice: 210 },
        { size: '34C', color: 'White', sku: 'JCK-BRA-34C-WHT', stockQty: 40, wholesaleRate: 295, mrp: 469, costPrice: 220 },
        { size: '36B', color: 'Ruby Red', sku: 'JCK-BRA-36B-RED', stockQty: 4, wholesaleRate: 295, mrp: 469, costPrice: 220 }, // Low stock alert
      ],
      isActive: true,
    });

    const prod4 = await Product.create({
      name: 'Rupa Frontline Modern Trunk',
      brand: 'Rupa',
      category: 'Trunk',
      description: 'Extended leg fit for zero ride-up, soft waistband.',
      variants: [
        { size: 'M (80cm)', color: 'Navy', sku: 'RUP-TRK-M-NVY', stockQty: 110, wholesaleRate: 98, mrp: 145, costPrice: 70 },
        { size: 'L (85cm)', color: 'Charcoal', sku: 'RUP-TRK-L-CHR', stockQty: 90, wholesaleRate: 102, mrp: 150, costPrice: 73 },
        { size: 'XL (90cm)', color: 'Black', sku: 'RUP-TRK-XL-BLK', stockQty: 75, wholesaleRate: 106, mrp: 155, costPrice: 76 },
      ],
      isActive: true,
    });

    console.log('Products created. Creating sample Orders and Payments...');

    // 4. Sample Order 1
    const order1 = await Order.create({
      orderNo: 'ORD-91001-101',
      retailParty: party1._id,
      bookedBy: staff1._id,
      bookedByRole: 'staff',
      items: [
        {
          product: prod1._id,
          productName: prod1.name,
          variantSku: 'LUX-VST-85-W',
          variantDetails: 'Size: 85 cm, Color: White',
          qty: 20,
          rate: 75,
          costPrice: 54,
          amount: 1500,
        },
        {
          product: prod2._id,
          productName: prod2.name,
          variantSku: 'MCH-BRF-M-AST',
          variantDetails: 'Size: Medium (80cm), Color: Assorted',
          qty: 30,
          rate: 64,
          costPrice: 45,
          amount: 1920,
        },
      ],
      totalAmount: 3420,
      status: 'Delivered',
      paymentMode: 'Cash',
      initialPaymentReceived: 2000,
      notes: 'Urgent delivery to Sadar Bazaar',
    });

    // Ledger for Order 1
    await Payment.create({
      retailParty: party1._id,
      order: order1._id,
      collectedBy: staff1._id,
      amount: 3420,
      mode: 'Credit',
      type: 'Debit',
      referenceNo: 'ORDER-ORD-91001-101',
      remarks: 'Order billed #ORD-91001-101',
    });

    await Payment.create({
      retailParty: party1._id,
      order: order1._id,
      collectedBy: staff1._id,
      amount: 2000,
      mode: 'Cash',
      type: 'Credit',
      referenceNo: 'CASH-REC-01',
      remarks: 'Partial cash paid at booking',
    });

    party1.currentBalance = party1.openingBalance + 3420 - 2000;
    await party1.save();

    // Sample Order 2 (Retailer self-ordered)
    const order2 = await Order.create({
      orderNo: 'ORD-91002-102',
      retailParty: party2._id,
      bookedBy: null,
      bookedByRole: 'retailer',
      items: [
        {
          product: prod3._id,
          productName: prod3.name,
          variantSku: 'JCK-BRA-34B-SKN',
          variantDetails: 'Size: 34B, Color: Skin',
          qty: 15,
          rate: 280,
          costPrice: 210,
          amount: 4200,
        },
      ],
      totalAmount: 4200,
      status: 'Confirmed',
      paymentMode: 'UPI',
      initialPaymentReceived: 0,
      notes: 'Please pack in carton box',
    });

    await Payment.create({
      retailParty: party2._id,
      order: order2._id,
      amount: 4200,
      mode: 'Credit',
      type: 'Debit',
      referenceNo: 'ORDER-ORD-91002-102',
      remarks: 'Order billed #ORD-91002-102',
    });

    party2.currentBalance = party2.openingBalance + 4200;
    await party2.save();

    // 5. Notifications
    await Notification.create({
      recipientRole: 'admin',
      title: 'New Order Received',
      message: 'Vikas Lingerie placed self-order #ORD-91002-102 for Rs. 4,200',
      link: '/admin/orders',
    });

    await Notification.create({
      recipient: party2._id,
      recipientRole: 'retailer',
      title: 'Order Confirmed',
      message: 'Your order #ORD-91002-102 is Confirmed and sent to packaging.',
      link: '/retailer/orders',
    });

    console.log('Database seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('DEMO LOGINS:');
    console.log('1. Admin:    admin@wholesale.com   / admin123');
    console.log('2. Staff:    rajesh@wholesale.com  / staff123');
    console.log('3. Retailer: RP1001                / retail123  (Gupta Hosiery)');
    console.log('4. Retailer: RP1002                / retail123  (Vikas Lingerie)');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
