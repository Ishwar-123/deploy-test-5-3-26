import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaPaperPlane, FaTimes, FaRobot, FaUser, FaMinus } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! How can I help you today?", sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Hide chatbot on Admin and Vendor pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor')) {
        return null;
    }

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input;
        const userMessage = {
            id: Date.now(),
            text: userText,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Call the real AI backend route
            const response = await axios.post(`${API_URL}/ai/chat`, { message: userText });

            const botId = Date.now() + 1;
            const botResponseText = response.data.reply;

            setIsTyping(false);

            // Add placeholder for streaming effect
            const initialBotMessage = {
                id: botId,
                text: '',
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, initialBotMessage]);

            // Streaming effect like ChatGPT
            let currentText = '';
            const words = botResponseText.split(' ');
            for (let i = 0; i < words.length; i++) {
                currentText += (i === 0 ? '' : ' ') + words[i];
                await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
                setMessages(prev => prev.map(msg =>
                    msg.id === botId ? { ...msg, text: currentText } : msg
                ));
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 2,
                text: "I'm having trouble connection. Please try again later.",
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${isOpen ? 'bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isOpen ? <FaTimes className="text-xl" /> : <FaComments className="text-xl" />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-[90vw] sm:w-[400px] h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800 origin-bottom-right"
                    >
                        {/* Header */}
                        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <FaRobot />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Assistant</h3>
                                    <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-sm border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
