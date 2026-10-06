const llmService = require('../services/llmService');
const { generateBusinessInsights } = require('../analysis/businessAnalysis');
const { analyzeInventory } = require('../analysis/inventoryAnalysis');
const { analyzeCustomers } = require('../analysis/customerAnalysis');
const { compareSalesPeriods } = require('../analysis/salesAnalysis');
const getSalesData = require('../tools/getSalesData');

/**
 * Business Agent - the core AI reasoning engine
 */
class BusinessAgent {
    
    /**
     * Very basic intent routing.
     * In a production system, this would use LLM Function Calling / Tool Calling.
     */
    async determineIntentAndFetchData(message) {
        const msg = message.toLowerCase();
        let data = {};
        
        try {
            if (msg.includes('inventory') || msg.includes('stock') || msg.includes('restock')) {
                data.inventoryAnalysis = await analyzeInventory();
            } else if (msg.includes('customer') || msg.includes('who')) {
                data.customerAnalysis = await analyzeCustomers();
            } else if (msg.includes('sales') || msg.includes('revenue') || msg.includes('yesterday') || msg.includes('today')) {
                if (msg.includes('yesterday')) {
                    data.sales = await getSalesData({ period: 'yesterday' });
                } else if (msg.includes('today')) {
                    data.sales = await getSalesData({ period: 'today' });
                } else if (msg.includes('compare') || msg.includes('vs')) {
                    data.salesAnalysis = await compareSalesPeriods('this month', 'last month');
                } else {
                    data.salesAnalysis = await compareSalesPeriods('this week', 'last week');
                }
            } else if (msg.includes('summary') || msg.includes('business') || msg.includes('doing')) {
                data.businessInsights = await generateBusinessInsights();
            } else {
                // Default fallback - fetch high level summary
                data.businessInsights = await generateBusinessInsights();
            }
        } catch (error) {
            console.error("Error fetching data for agent:", error);
            data.error = "Failed to retrieve some business data.";
        }
        
        return data;
    }

    /**
     * Process the user's natural language message
     */
    async process(message, user) {
        // 1 & 2 & 3 & 4. Understand intent and call tools
        const contextData = await this.determineIntentAndFetchData(message);
        
        // 5 & 6. Analyze data and generate response using LLM
        const aiResponseText = await llmService.generateResponse(message, contextData);

        // Extract structured insights/recommendations if present in the data
        const insights = contextData.businessInsights ? contextData.businessInsights.insights : [];
        const recommendations = contextData.inventoryAnalysis ? contextData.inventoryAnalysis.restock_recommendations : 
            (contextData.businessInsights ? contextData.businessInsights.raw_analysis.inventory.restock_recommendations : []);

        return {
            answer: aiResponseText,
            insights: insights,
            recommendations: recommendations,
            data: contextData // Raw data for the frontend to render charts if needed
        };
    }
}

module.exports = new BusinessAgent();
