import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import AIAgentChat from '../../components/ai/AIAgentChat';
import AIInsightCard from '../../components/ai/AIInsightCard';
import RecommendationCard from '../../components/ai/RecommendationCard';

const AIAgent = () => {
    const [messages, setMessages] = useState([{
        id: 1,
        sender: 'ai',
        text: 'Hello! I am your AI Business Operations Assistant. Ask me about your sales, inventory, or customers.',
        data: null
    }]);
    const [loading, setLoading] = useState(false);
    const [latestData, setLatestData] = useState(null);

    const handleSendMessage = async (messageText) => {
        const newUserMsg = { id: Date.now(), sender: 'user', text: messageText };
        setMessages(prev => [...prev, newUserMsg]);
        setLoading(true);

        try {
            const response = await api.post('/ai/chat', { message: messageText });
            const data = response.data;
            
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: data.answer,
                insights: data.insights,
                recommendations: data.recommendations
            }]);
            
            if (data.data) {
                setLatestData(data.data);
            }
        } catch (error) {
            console.error('AI Request failed:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: 'Sorry, I encountered an error while processing your request.',
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full gap-6">
            {/* Chat Section */}
            <div className="w-2/3 flex flex-col bg-white rounded-lg shadow border border-gray-200 h-[calc(100vh-8rem)]">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Business Assistant</h2>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <AIAgentChat 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        loading={loading} 
                    />
                </div>
            </div>

            {/* Dashboard / Insights Section */}
            <div className="w-1/3 flex flex-col gap-4 overflow-y-auto h-[calc(100vh-8rem)] pr-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2">Suggested Questions</h3>
                    <div className="flex flex-col gap-2">
                        {['Sales Overview', 'Inventory Risks', 'Top Products', 'Customer Insights', 'Business Summary'].map((q, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleSendMessage(q)}
                                disabled={loading}
                                className="text-left text-sm text-blue-600 hover:text-blue-800 hover:underline bg-white px-3 py-2 rounded shadow-sm border border-blue-100 transition"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {latestData && latestData.businessInsights && latestData.businessInsights.insights && (
                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-700 mt-2">Latest Insights</h3>
                        {latestData.businessInsights.insights.map((insight, idx) => (
                            <AIInsightCard key={idx} insight={insight} />
                        ))}
                    </div>
                )}

                {latestData && latestData.inventoryAnalysis && latestData.inventoryAnalysis.restock_recommendations && (
                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-700 mt-2">Recommendations</h3>
                        {latestData.inventoryAnalysis.restock_recommendations.map((rec, idx) => (
                            <RecommendationCard key={idx} recommendation={rec} />
                        ))}
                    </div>
                )}
                
                {/* Fallback for general recommendations */}
                {latestData && latestData.businessInsights && latestData.businessInsights.raw_analysis && latestData.businessInsights.raw_analysis.inventory && (
                     <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-700 mt-2">Recommendations</h3>
                        {latestData.businessInsights.raw_analysis.inventory.restock_recommendations.map((rec, idx) => (
                            <RecommendationCard key={idx} recommendation={rec} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAgent;
