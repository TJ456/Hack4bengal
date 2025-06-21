
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ExternalLink, X, Smartphone, Shield } from 'lucide-react';

const TelegramCompanion: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem('telegram-companion-dismissed');
    return dismissed === 'true';
  });

  // Save dismissal state to localStorage
  const handleDismiss = () => {
    setIsDismissed(true);
    setShowTooltip(false);
    localStorage.setItem('telegram-companion-dismissed', 'true');
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTooltip && !target.closest('.telegram-companion')) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Don't render if dismissed
  if (isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 telegram-companion">
      {/* Main Telegram Button */}
      <div className="relative">
        <Button
          onClick={() => setShowTooltip(!showTooltip)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        
        {/* Notification Badge */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">1</span>
        </div>
      </div>

      {/* Tooltip Popup */}
      {showTooltip && (
        <div className="absolute bottom-16 left-0 w-80 animate-scale-in">
          <div className="bg-black/90 backdrop-blur-lg rounded-lg border border-cyan-500/30 p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-cyan-400" />
                <span className="font-semibold text-white">Telegram Web App</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                  NEW
                </Badge>
              </div>
              <button 
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Access your AI wallet guardian directly inside Telegram! Get real-time scam alerts on your mobile device.
              </p>
              
              <div className="flex items-center space-x-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Smartphone className="h-5 w-5 text-cyan-400" />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Mobile Protection</div>
                  <div className="text-gray-400 text-xs">Real-time alerts • Quick reports • Instant blocking</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Shield className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Sync Protection</div>
                  <div className="text-gray-400 text-xs">Desktop + Mobile • Cross-platform security</div>
                </div>
              </div>
              
              <div className="flex space-x-2">                <Button 
                  size="sm" 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => {
                    window.open('https://t.me/unhackable_wallet_bot', '_blank');
                    // Track that user clicked on Telegram bot link
                    try {
                      fetch('/api/analytics/track', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          event: 'telegram_bot_open',
                          source: 'companion_popup'
                        }),
                      });
                    } catch (error) {
                      console.error('Failed to track event:', error);
                    }
                    setShowTooltip(false);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Try Telegram App
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setShowTooltip(false)}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramCompanion;
