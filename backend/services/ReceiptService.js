const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const RECEIPT_DIR = path.resolve(__dirname, '../storage/receipts');

async function ensureReceiptDir() {
  await fs.promises.mkdir(RECEIPT_DIR, { recursive: true });
}

function formatCurrency(value, currency = 'LKR') {
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    // Fallback for environments without Intl currency support.
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

async function generateReceipt({ payment, bill, user }) {
  await ensureReceiptDir();
  const fileName = `receipt-${payment._id}.pdf`;
  const filePath = path.join(RECEIPT_DIR, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(20).text('Smart Waste Management System', { align: 'center' });
  doc.moveDown(0.5).fontSize(14).text('Payment Receipt', { align: 'center' });
  doc.moveDown(1);

  doc
    .fontSize(12)
    .text(`Receipt ID: ${payment._id}`)
    .text(`Bill Period: ${bill.period}`)
    .text(`Billing Model: ${bill.billingModelUsed}`)
    .text(`Issued On: ${new Date().toLocaleString()}`)
    .moveDown(1);

  doc.fontSize(12).text('Billed To:', { underline: true });
  doc
    .text(user.name)
    .text(user.email)
    .text(`${user.address.line1}, ${user.address.city}`)
    .moveDown(1);

  const breakdown = bill.breakdown || {};
  doc.fontSize(12).text('Charge Breakdown:', { underline: true });
  doc
    .text(`Base Fee: ${formatCurrency(breakdown.base, payment.currency)}`)
    .text(`Weight Charges: ${formatCurrency(breakdown.weightKg, payment.currency)}`)
    .text(`Extra Fees: ${formatCurrency(breakdown.extraFee, payment.currency)}`)
    .text(`Recycling Credits: ${formatCurrency(-Math.abs(breakdown.recyclingCredit || 0), payment.currency)}`)
    .moveDown(1);

  doc
    .fontSize(14)
    .text(`Total Paid: ${formatCurrency(payment.amount, payment.currency)}`, { underline: true })
    .moveDown(1);

  doc.fontSize(11).text('Thank you for keeping our city clean!', { align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return { filePath, fileName };
}

module.exports = {
  generateReceipt,
};
