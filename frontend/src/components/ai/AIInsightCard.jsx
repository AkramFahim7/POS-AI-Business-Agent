import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiInfo } from 'react-icons/fi';

const AIInsightCard = ({ insight }) => {
    
    let colorClass = 'bg-gray-50 border-gray-200 text-gray-700';
    let Icon = FiInfo;
    let titleColorClass = 'text-gray-800';

    if (insight.type === 'POSITIVE') {
        colorClass = 'bg-green-50 border-green-200 text-green-800';
        Icon = FiTrendingUp;
        titleColorClass = 'text-green-900';
    } else if (insight.type === 'RISK' || insight.type === 'WARNING') {
        colorClass = 'bg-orange-50 border-orange-200 text-orange-800';
        Icon = FiTrendingDown;
        titleColorClass = 'text-orange-900';
    } else if (insight.type === 'CRITICAL') {
        colorClass = 'bg-red-50 border-red-200 text-red-800';
        Icon = FiAlertCircle;
        titleColorClass = 'text-red-900';
    }

    return (
        <div className={\`border rounded-md p-4 shadow-sm \${colorClass}\`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="text-lg" />
                <h4 className={\`font-semibold text-sm \${titleColorClass}\`}>{insight.title}</h4>
            </div>
            <p className="text-sm">{insight.description}</p>
            {insight.confidence && (
                <div className="mt-3 flex justify-end">
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded font-medium">
                        Confidence: {insight.confidence}
                    </span>
                </div>
            )}
        </div>
    );
};

export default AIInsightCard;
