const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const invoicesDir = path.join(__dirname, '../../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

const BusinessProfile = require('../models/BusinessProfile');

/**
 * Generates a clean, professional invoice PDF
 * @param {Object} order - Populated Order document with retailParty and items
 * @returns {Promise<string>} - Absolute path to the generated PDF
 */
const generateInvoicePDF = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const businessProfile = await BusinessProfile.findOne() || {
        businessName: 'PREMIUM UNDERGARMENTS WHOLESALE',
        address: 'Central Market Warehouse',
        gstin: '27AABCP1234F1Z9',
        state: 'Maharashtra',
        phone: '+91 98765 43210',
        email: 'billing@wholesale.com',
      };
    const fileName = `Invoice_${order.orderNo}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Wholesale Brand Header
    doc
      .fillColor('#1e293b')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(businessProfile.businessName || 'PREMIUM UNDERGARMENTS WHOLESALE', { align: 'left' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(businessProfile.address || 'Central Market Warehouse')
      .text(`GSTIN: ${businessProfile.gstin || 'N/A'} | State: ${businessProfile.state || 'N/A'}`)
      .text(`Phone: ${businessProfile.phone || 'N/A'} | Email: ${businessProfile.email || 'N/A'}`)
      .moveDown(0.5);

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Invoice Meta & Customer Details
    const metaTop = doc.y;

    // Left Column: Bill To
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('BILL TO:', 40, metaTop)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(order.retailParty?.partyName || 'Retail Customer')
      .text(`Prop: ${order.retailParty?.ownerName || 'N/A'}`)
      .text(`Address: ${order.retailParty?.shopAddress || 'Local Market'}`)
      .text(`Contact: ${order.retailParty?.contactNo || 'N/A'}`)
      .text(`GST: ${order.retailParty?.gstNo || 'Unregistered'}`);

    // Right Column: Invoice Details
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('TAX INVOICE', 350, metaTop, { align: 'right' })
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(`Invoice No: ${order.orderNo}`, 350, doc.y, { align: 'right' })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 350, doc.y, { align: 'right' })
      .text(`Status: ${order.status.toUpperCase()}`, 350, doc.y, { align: 'right' })
      .text(`Payment Mode: ${order.paymentMode || 'Credit'}`, 350, doc.y, { align: 'right' });

    doc.y = Math.max(doc.y, metaTop + 95);
    doc.moveDown(1);

    // Determine if intra-state
    const isSameState = order.retailParty?.state && businessProfile.state &&
      order.retailParty.state.toLowerCase() === businessProfile.state.toLowerCase();

    // Items Table Header
    const tableTop = doc.y;
    doc.rect(40, tableTop, 515, 24).fill('#f1f5f9');

    doc
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('ITEM', 50, tableTop + 7, { width: 100 })
      .text('HSN', 150, tableTop + 7)
      .text('QTY', 200, tableTop + 7, { width: 30, align: 'right' })
      .text('RATE', 235, tableTop + 7, { width: 45, align: 'right' })
      .text('TAXABLE', 285, tableTop + 7, { width: 50, align: 'right' });

    if (isSameState) {
      doc
        .text('CGST', 345, tableTop + 7, { width: 40, align: 'right' })
        .text('SGST', 390, tableTop + 7, { width: 40, align: 'right' });
    } else {
      doc
        .text('IGST', 370, tableTop + 7, { width: 60, align: 'right' });
    }

    doc.text('TOTAL', 485, tableTop + 7, { width: 65, align: 'right' });

    let currentY = tableTop + 28;

    // Items Rows
    order.items.forEach((item, index) => {
      const isAlt = index % 2 === 1;
      if (isAlt) {
        doc.rect(40, currentY - 4, 515, 22).fill('#f8fafc');
      }

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#1e293b')
        .text(`${item.productName || 'Item'} (${item.variantSku || ''})`, 50, currentY, { width: 100, lineBreak: false })
        .fillColor('#64748b')
        .text(item.hsnCode || '-', 150, currentY, { width: 45, lineBreak: false })
        .fillColor('#0f172a')
        .text(String(item.qty) + (item.unitType ? ` ${item.unitType}` : ''), 200, currentY, { width: 30, align: 'right' })
        .text(Number(item.rate).toFixed(2), 235, currentY, { width: 45, align: 'right' })
        .text(Number(item.taxableAmount || (item.qty * item.rate)).toFixed(2), 285, currentY, { width: 50, align: 'right' });

      if (isSameState) {
        doc
          .text(Number(item.cgstAmount || 0).toFixed(2), 345, currentY, { width: 40, align: 'right' })
          .text(Number(item.sgstAmount || 0).toFixed(2), 390, currentY, { width: 40, align: 'right' });
      } else {
        doc
          .text(Number(item.igstAmount || 0).toFixed(2), 370, currentY, { width: 60, align: 'right' });
      }

      doc
        .font('Helvetica-Bold')
        .text(Number(item.amount).toFixed(2), 485, currentY, { width: 65, align: 'right' });

      currentY += 22;
    });

    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 10;

    // Summary Totals
    const totalBoxTop = currentY;
    
    // Left Box (Tax Summary)
    doc
      .fontSize(9)
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .text('Taxable Amount:', 40, totalBoxTop)
      .font('Helvetica')
      .text(Number(order.taxableAmount || 0).toFixed(2), 150, totalBoxTop);
      
    if (isSameState) {
      doc
        .font('Helvetica-Bold')
        .text('CGST:', 40, totalBoxTop + 15)
        .font('Helvetica')
        .text(Number(order.cgstAmount || 0).toFixed(2), 150, totalBoxTop + 15)
        .font('Helvetica-Bold')
        .text('SGST:', 40, totalBoxTop + 30)
        .font('Helvetica')
        .text(Number(order.sgstAmount || 0).toFixed(2), 150, totalBoxTop + 30);
    } else {
      doc
        .font('Helvetica-Bold')
        .text('IGST:', 40, totalBoxTop + 15)
        .font('Helvetica')
        .text(Number(order.igstAmount || 0).toFixed(2), 150, totalBoxTop + 15);
    }

    // Right Box (Grand Total)
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text('Total Qty:', 330, totalBoxTop)
      .font('Helvetica')
      .text(
        String(order.items.reduce((sum, it) => sum + it.qty, 0)),
        400,
        totalBoxTop,
        { width: 50, align: 'right' }
      )
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#1e40af')
      .text('Grand Total:', 330, totalBoxTop + 20)
      .text(`Rs. ${Number(order.grandTotal || order.totalAmount).toFixed(2)}`, 430, totalBoxTop + 20, {
        width: 120,
        align: 'right',
      });

    // Terms and Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text('Terms & Conditions:', 40, 740)
      .text('1. Goods once sold will not be taken back without prior authorization.', 40, 750)
      .text('2. Interest @ 18% per annum will be charged if payment is delayed past credit limit.', 40, 760)
      .text('Authorized Signatory', 450, 765, { align: 'right' });

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
