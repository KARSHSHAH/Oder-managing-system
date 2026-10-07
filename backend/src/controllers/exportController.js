const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const exceljs = require('exceljs');

// @desc    Export Sales to Busy (Excel)
// @route   GET /api/export/busy/sales
// @access  Private/Admin
const exportSalesToBusy = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const query = { status: 'Delivered' };
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const orders = await Order.find(query).populate('retailParty').sort({ createdAt: 1 });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Sales Export');

    worksheet.columns = [
      { header: 'Voucher Date', key: 'voucherDate', width: 15 },
      { header: 'Party Name', key: 'partyName', width: 30 },
      { header: 'Party GSTIN', key: 'partyGstin', width: 20 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'HSN Code', key: 'hsnCode', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Rate', key: 'rate', width: 15 },
      { header: 'Taxable Amount', key: 'taxableAmount', width: 15 },
      { header: 'CGST Amount', key: 'cgstAmount', width: 15 },
      { header: 'SGST Amount', key: 'sgstAmount', width: 15 },
      { header: 'IGST Amount', key: 'igstAmount', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Order No', key: 'orderNo', width: 20 },
    ];

    orders.forEach(order => {
      const voucherDate = new Date(order.createdAt).toLocaleDateString('en-GB');
      const partyName = order.retailParty?.partyName || 'Unknown Party';
      const partyGstin = order.retailParty?.gstin || '';
      const orderNo = order.orderNo;

      order.items.forEach(item => {
        worksheet.addRow({
          voucherDate,
          partyName,
          partyGstin,
          itemName: item.productName || 'Unknown Item',
          hsnCode: item.hsnCode || '',
          quantity: item.qty || 0,
          unit: item.unitType || 'Pcs',
          rate: item.rate || 0,
          taxableAmount: item.taxableAmount || 0,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,
          igstAmount: item.igstAmount || 0,
          totalAmount: item.amount || 0,
          orderNo
        });
      });
    });

    const fromDateStr = from ? new Date(from).toISOString().split('T')[0] : 'start';
    const toDateStr = to ? new Date(to).toISOString().split('T')[0] : 'end';
    const fileName = `busy-sales-export-${fromDateStr}-to-${toDateStr}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export Purchases to Busy (Excel)
// @route   GET /api/export/busy/purchase
// @access  Private/Admin
const exportPurchasesToBusy = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const query = {};
    
    if (from || to) {
      query.billDate = {};
      if (from) query.billDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.billDate.$lte = toDate;
      }
    }

    const purchases = await Purchase.find(query).sort({ billDate: 1 });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Export');

    worksheet.columns = [
      { header: 'Voucher Date', key: 'voucherDate', width: 15 },
      { header: 'Supplier Name', key: 'supplierName', width: 30 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Rate', key: 'rate', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
    ];

    purchases.forEach(purchase => {
      const voucherDate = purchase.billDate ? new Date(purchase.billDate).toLocaleDateString('en-GB') : '';
      const supplierName = purchase.supplierName || 'Unknown Supplier';

      purchase.items.forEach(item => {
        worksheet.addRow({
          voucherDate,
          supplierName,
          itemName: item.itemName || item.rawText || 'Unknown Item',
          quantity: item.qty || 0,
          unit: item.unitType || 'Pcs',
          rate: item.price || 0,
          amount: (item.qty || 0) * (item.price || 0)
        });
      });
    });

    const fromDateStr = from ? new Date(from).toISOString().split('T')[0] : 'start';
    const toDateStr = to ? new Date(to).toISOString().split('T')[0] : 'end';
    const fileName = `busy-purchase-export-${fromDateStr}-to-${toDateStr}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportSalesToBusy,
  exportPurchasesToBusy
};
