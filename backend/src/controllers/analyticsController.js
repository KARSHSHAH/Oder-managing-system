const Order = require('../models/Order');
const Product = require('../models/Product');
const RetailParty = require('../models/RetailParty');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc   High-level business summary KPIs
// @route  GET /api/analytics/overview
// @access Private/Admin
const getOverview = async (req, res, next) => {
  try {
    const totalOrdersCount = await Order.countDocuments();
    const pendingOrdersCount = await Order.countDocuments({ status: 'Pending' });
    const totalPartiesCount = await RetailParty.countDocuments({ status: 'active' });

    // Total sales revenue from Confirmed/Packed/Dispatched/Delivered orders
    const salesResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = salesResult[0]?.totalRevenue || 0;

    // Total outstanding dues from RetailParties
    const duesResult = await RetailParty.aggregate([
      { $match: { status: { $ne: 'inactive' } } },
      { $group: { _id: null, totalOutstanding: { $sum: '$currentBalance' } } },
    ]);
    const totalOutstanding = duesResult[0]?.totalOutstanding || 0;

    // Total payments collected
    const collectedResult = await Payment.aggregate([
      { $match: { type: 'Credit' } },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } },
    ]);
    const totalCollected = collectedResult[0]?.totalCollected || 0;

    res.json({
      totalRevenue,
      totalOutstanding,
      totalCollected,
      totalOrdersCount,
      pendingOrdersCount,
      totalPartiesCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Sales revenue trend (daily, weekly, monthly)
// @route  GET /api/analytics/sales-trend
// @access Private/Admin
const getSalesTrend = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;

    let format;
    if (period === 'monthly') {
      format = '%Y-%m';
    } else if (period === 'weekly') {
      format = '%Y-W%V';
    } else {
      format = '%Y-%m-%d';
    }

    const trend = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          date: '$_id',
          sales: '$totalSales',
          orders: '$orderCount',
        },
      },
    ]);

    res.json(trend);
  } catch (error) {
    next(error);
  }
};

// @desc   Top-selling products and variants
// @route  GET /api/analytics/top-products
// @access Private/Admin
const getTopProducts = async (req, res, next) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.product',
            name: '$items.productName',
            variantSku: '$items.variantSku',
            variantDetails: '$items.variantDetails',
          },
          totalQtySold: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.amount' },
        },
      },
      { $sort: { totalQtySold: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: '$_id.productId',
          name: '$_id.name',
          variantSku: '$_id.variantSku',
          variantDetails: '$_id.variantDetails',
          qty: '$totalQtySold',
          revenue: '$totalRevenue',
        },
      },
    ]);

    res.json(topProducts);
  } catch (error) {
    next(error);
  }
};

// @desc   Retail party ranking by order purchase value
// @route  GET /api/analytics/party-ranking
// @access Private/Admin
const getPartyRanking = async (req, res, next) => {
  try {
    const ranking = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$retailParty',
          totalPurchased: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { totalPurchased: -1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: 'retailparties',
          localField: '_id',
          foreignField: '_id',
          as: 'party',
        },
      },
      { $unwind: '$party' },
      {
        $project: {
          _id: 1,
          partyName: '$party.partyName',
          ownerName: '$party.ownerName',
          areaRoute: '$party.areaRoute',
          currentBalance: '$party.currentBalance',
          totalPurchased: 1,
          ordersCount: 1,
        },
      },
    ]);

    res.json(ranking);
  } catch (error) {
    next(error);
  }
};

// @desc   Outstanding dues per party (sorted descending)
// @route  GET /api/analytics/outstanding-dues
// @access Private/Admin
const getOutstandingDues = async (req, res, next) => {
  try {
    const dues = await RetailParty.find({ currentBalance: { $gt: 0 } })
      .select('partyName ownerName contactNo areaRoute currentBalance creditLimit status')
      .sort({ currentBalance: -1 });

    res.json(dues);
  } catch (error) {
    next(error);
  }
};

// @desc   Stock alerts (variants with low stock or dead stock)
// @route  GET /api/analytics/stock-alerts
// @access Private/Admin
const getStockAlerts = async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold) || 15;
    const products = await Product.find({ isActive: true });

    const alerts = [];
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.stockQty <= threshold) {
          alerts.push({
            productId: p._id,
            productName: p.name,
            brand: p.brand,
            category: p.category,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stockQty: v.stockQty,
            wholesaleRate: v.wholesaleRate,
            isCritical: v.stockQty <= 5,
          });
        }
      });
    });

    alerts.sort((a, b) => a.stockQty - b.stockQty);
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

// @desc   Staff performance (orders booked & collections made)
// @route  GET /api/analytics/staff-performance
// @access Private/Admin
const getStaffPerformance = async (req, res, next) => {
  try {
    const staffList = await User.find({ role: 'staff' }).select('name email phone areaAssigned status');

    const performance = await Promise.all(
      staffList.map(async (staff) => {
        // Orders booked count & total value
        const orderStats = await Order.aggregate([
          { $match: { bookedBy: staff._id, status: { $ne: 'Cancelled' } } },
          {
            $group: {
              _id: null,
              ordersBooked: { $sum: 1 },
              totalOrderValue: { $sum: '$totalAmount' },
            },
          },
        ]);

        // Collections made
        const paymentStats = await Payment.aggregate([
          { $match: { collectedBy: staff._id, type: 'Credit' } },
          {
            $group: {
              _id: null,
              collectionsCount: { $sum: 1 },
              totalCollected: { $sum: '$amount' },
            },
          },
        ]);

        return {
          staffId: staff._id,
          name: staff.name,
          email: staff.email,
          areas: staff.areaAssigned,
          status: staff.status,
          ordersBooked: orderStats[0]?.ordersBooked || 0,
          totalOrderValue: orderStats[0]?.totalOrderValue || 0,
          collectionsCount: paymentStats[0]?.collectionsCount || 0,
          totalCollected: paymentStats[0]?.totalCollected || 0,
        };
      })
    );

    res.json(performance);
  } catch (error) {
    next(error);
  }
};

// @desc   Profit margin analysis (wholesale rate vs cost price)
// @route  GET /api/analytics/profit-margin
// @access Private/Admin
const getProfitMargin = async (req, res, next) => {
  try {
    const margins = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.product',
            name: '$items.productName',
          },
          totalSoldQty: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.amount' },
          totalCost: {
            $sum: { $multiply: ['$items.qty', { $ifNull: ['$items.costPrice', 0] }] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          qtySold: '$totalSoldQty',
          revenue: '$totalRevenue',
          cost: '$totalCost',
          estimatedProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
          marginPercentage: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalRevenue', '$totalCost'] },
                      '$totalRevenue',
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { estimatedProfit: -1 } },
      { $limit: 15 },
    ]);

    res.json(margins);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getPartyRanking,
  getOutstandingDues,
  getStockAlerts,
  getStaffPerformance,
  getProfitMargin,
};
