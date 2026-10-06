import React, { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';

const AIAgentChat = ({ messages, onSendMessage, loading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={\`flex \${msg.sender === 'user' ? 'justify-end' : 'justify-start'}\`}
                    >
                        <div 
                            className={\`max-w-[80%] rounded-lg px-4 py-3 shadow-sm \${
                                msg.sender === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : msg.isError 
                                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }\`}
                        >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            
                            {/* Render inline insights if they came with the message and not rendered on side */}
                            {msg.sender === 'ai' && msg.insights && msg.insights.length > 0 && (
                                <div className="mt-3 text-sm text-gray-600 border-t pt-2">
                                    <span className="font-semibold text-gray-700">Identified Insights: </span>
                                    {msg.insights.length}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 text-gray-500 rounded-lg rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            <span className="ml-1 text-sm">Analyzing data...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your business..."
                        disabled={loading}
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSend />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIAgentChat;
