const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const receiptsDir = path.join(__dirname, '../../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

const BusinessProfile = require('../models/BusinessProfile');

/**
 * Generates a clean, professional receipt PDF for a payment
 * @param {Object} payment - Populated Payment document with retailParty, collectedBy, and order (if any)
 * @param {Number} runningBalance - The running balance after this payment
 * @returns {Promise<string>} - Absolute path to the generated PDF
 */
const generateReceiptPDF = (payment, runningBalance) => {
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
      const fileName = `Receipt_${payment.receiptNo}.pdf`;
      const filePath = path.join(receiptsDir, fileName);

      const doc = new PDFDocument({ margin: 40, size: 'A5' });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header
      doc
        .fillColor('#1e293b')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(businessProfile.businessName || 'PREMIUM UNDERGARMENTS WHOLESALE', { align: 'center' });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(businessProfile.address || 'Central Market Warehouse', { align: 'center' })
        .text(`Phone: ${businessProfile.phone || 'N/A'} | Email: ${businessProfile.email || 'N/A'}`, { align: 'center' })
        .moveDown(0.5);

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(380, doc.y).stroke();
      doc.moveDown(1);

      // Receipt Title
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0f172a')
        .text('PAYMENT RECEIPT', { align: 'center' })
        .moveDown(1);

      // Receipt Details
      const metaTop = doc.y;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#334155')
        .text(`Receipt No:`, 40, doc.y, { continued: true })
        .font('Helvetica')
        .text(` ${payment.receiptNo}`)
        .font('Helvetica-Bold')
        .text(`Date:`, 40, doc.y, { continued: true })
        .font('Helvetica')
        .text(` ${new Date(payment.receiptGeneratedAt || payment.createdAt).toLocaleDateString('en-IN')}`)
        .moveDown(0.5);

      // Retail Party Details
      doc
        .font('Helvetica-Bold')
        .text('Received From:', 40, doc.y)
        .font('Helvetica')
        .text(`${payment.retailParty?.partyName || 'Retail Customer'}`)
        .text(`${payment.retailParty?.shopAddress || 'Local Market'}`)
        .moveDown(0.5);

      // Payment Information
      const detailsTop = doc.y;
      doc.rect(40, detailsTop, 340, 95).fill('#f8fafc').stroke('#e2e8f0');
      
      let currentY = detailsTop + 10;
      
      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text('Amount Received:', 50, currentY)
        .font('Helvetica')
        .text(`Rs. ${Number(payment.amount).toFixed(2)}`, 200, currentY);
        
      currentY += 15;
      doc
        .font('Helvetica-Bold')
        .text('Payment Mode:', 50, currentY)
        .font('Helvetica')
        .text(`${payment.mode}`, 200, currentY);

      currentY += 15;
      if (payment.referenceNo) {
        doc
          .font('Helvetica-Bold')
          .text('Reference No:', 50, currentY)
          .font('Helvetica')
          .text(`${payment.referenceNo}`, 200, currentY);
        currentY += 15;
      }
      
      if (payment.order && payment.order.orderNo) {
        doc
          .font('Helvetica-Bold')
          .text('Linked Order:', 50, currentY)
          .font('Helvetica')
          .text(`${payment.order.orderNo}`, 200, currentY);
        currentY += 15;
      }

      doc
        .font('Helvetica-Bold')
        .text('Collected By:', 50, currentY)
        .font('Helvetica')
        .text(`${payment.collectedBy?.name || 'System Admin'}`, 200, currentY);
        
      currentY += 15;
      
      // Draw a line before balance
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY + 5).lineTo(380, currentY + 5).stroke();
      currentY += 15;

      doc
        .fillColor('#1e40af')
        .font('Helvetica-Bold')
        .text('Running Balance:', 50, currentY)
        .text(`Rs. ${Number(runningBalance).toFixed(2)}`, 200, currentY);

      doc.y = currentY + 30;

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text('This is a computer generated receipt and does not require a physical signature.', 40, doc.y, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateReceiptPDF };
