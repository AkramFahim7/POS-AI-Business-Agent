require('dotenv').config({ path: './.env' });
const getSalesData = require('./ai-agent/tools/getSalesData');
const getInventoryData = require('./ai-agent/tools/getInventoryData');
const getProductData = require('./ai-agent/tools/getProductData');
const getCustomerData = require('./ai-agent/tools/getCustomerData');
const getBusinessMetrics = require('./ai-agent/tools/getBusinessMetrics');

const runTests = async () => {
    try {
        console.log('Testing getSalesData...');
        const sales = await getSalesData({ period: 'this month' });
        console.log('Sales Data:', JSON.stringify(sales, null, 2).substring(0, 200) + '...');
        
        console.log('\nTesting getInventoryData...');
        const inventory = await getInventoryData();
        console.log('Inventory Data:', JSON.stringify(inventory, null, 2).substring(0, 200) + '...');
        
        console.log('\nTesting getProductData...');
        const products = await getProductData({ limit: 2 });
        console.log('Product Data:', JSON.stringify(products, null, 2).substring(0, 200) + '...');
        
        console.log('\nTesting getCustomerData...');
        const customers = await getCustomerData();
        console.log('Customer Data:', JSON.stringify(customers, null, 2).substring(0, 200) + '...');
        
        console.log('\nTesting getBusinessMetrics...');
        const metrics = await getBusinessMetrics();
        console.log('Business Metrics:', JSON.stringify(metrics, null, 2).substring(0, 200) + '...');

        console.log('\nAll tools ran successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error running tests:', err);
        process.exit(1);
    }
};

runTests();
