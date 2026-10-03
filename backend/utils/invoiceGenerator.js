const db = require('../config/db');

const generateInvoiceNumber = async () => {
    // Basic format INV-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    
    const [rows] = await db.query(
        'SELECT invoice_number FROM sales WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
        [`INV-${dateStr}-%`]
    );

    let nextNum = 1;
    if (rows.length > 0) {
        const lastInvoice = rows[0].invoice_number;
        const lastNum = parseInt(lastInvoice.split('-')[2]);
        nextNum = lastNum + 1;
    }

    const paddedNum = nextNum.toString().padStart(4, '0');
    return `INV-${dateStr}-${paddedNum}`;
};

module.exports = { generateInvoiceNumber };
