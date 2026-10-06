import React from 'react';
import { FiCheckCircle, FiShoppingCart } from 'react-icons/fi';

const RecommendationCard = ({ recommendation }) => {
    return (
        <div className="bg-white border border-blue-200 rounded-md p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 p-1.5 rounded text-blue-600">
                    <FiShoppingCart />
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-gray-800">Restock Recommended</h4>
                    <p className="text-sm font-medium text-blue-700 mt-1">{recommendation.name} (SKU: {recommendation.sku})</p>
                    <p className="text-xs text-gray-600 mt-1">{recommendation.reason}</p>
                    
                    <div className="mt-3 flex items-center gap-2">
                        <span className={\`text-xs px-2 py-1 rounded-full font-bold \${
                            recommendation.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                            recommendation.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                            'bg-green-100 text-green-800'
                        }\`}>
                            {recommendation.priority} PRIORITY
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationCard;
