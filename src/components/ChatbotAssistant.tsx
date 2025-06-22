import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, X } from 'lucide-react';

const ChatbotAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  // WebSocket connection setup
  useEffect(() => {
    if (isOpen && !socketRef.current) {
      socketRef.current = new WebSocket('wss://yugamax--chatbot.hf.space/ws/chat');

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      socketRef.current.onmessage = (event) => {
        setMessages((prev) => [...prev, { text: event.data, isUser: false }]);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        socketRef.current = null;
      };
    }

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [isOpen]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.chatbot-assistant')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);

    // Send through WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(input);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          text: 'WebSocket is not connected. Please try again later.',
          isUser: false,
        },
      ]);
    }

    setInput('');
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 chatbot-assistant">
      {/* Main Chat Button */}
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-80 animate-scale-in">
          <div className="bg-black/90 backdrop-blur-lg rounded-lg border border-purple-500/30 p-4 shadow-xl h-[400px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-purple-400" />
                <span className="font-semibold text-white">AI Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-gray-400 text-sm text-center mt-8">
                  👋 Hi! How can I help you today?
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.isUser
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg text-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotAssistant;