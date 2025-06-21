
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Database, Zap } from 'lucide-react';

interface AILearningFeedbackProps {
  trigger: boolean;
  actionType: 'vote' | 'report' | 'block' | 'scan';
  onComplete?: () => void;
}

const AILearningFeedback: React.FC<AILearningFeedbackProps> = ({ trigger, actionType, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [learningData, setLearningData] = useState({
    vectors: 0,
    confidence: 0,
    patterns: 0
  });

  const getActionData = (type: string) => {
    switch (type) {
      case 'vote':
        return {
          vectors: Math.floor(Math.random() * 500) + 800,
          confidence: 2.3,
          patterns: Math.floor(Math.random() * 50) + 25,
          message: 'DAO vote recorded — AI governance model updated'
        };
      case 'report':
        return {
          vectors: Math.floor(Math.random() * 800) + 1200,
          confidence: 3.1,
          patterns: Math.floor(Math.random() * 80) + 40,
          message: 'Threat report analyzed — New attack vectors learned'
        };
      case 'block':
        return {
          vectors: Math.floor(Math.random() * 600) + 1000,
          confidence: 2.8,
          patterns: Math.floor(Math.random() * 60) + 30,
          message: 'Transaction blocked — Defense matrix strengthened'
        };
      case 'scan':
        return {
          vectors: Math.floor(Math.random() * 300) + 400,
          confidence: 1.5,
          patterns: Math.floor(Math.random() * 30) + 15,
          message: 'Real-time scan completed — Pattern database updated'
        };
      default:
        return {
          vectors: 500,
          confidence: 2.0,
          patterns: 25,
          message: 'AI model updated'
        };
    }
  };

  useEffect(() => {
    if (trigger) {
      const data = getActionData(actionType);
      setLearningData(data);
      setIsVisible(true);

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [trigger, actionType, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-scale-in">
      <Card className="bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur-lg border-purple-500/30 border-2 min-w-[320px]">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Learning
                </Badge>
                <span className="text-green-400 text-xs font-medium">ACTIVE</span>
              </div>
              
              <p className="text-white text-sm font-medium">
                {getActionData(actionType).message}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <Database className="h-3 w-3 text-cyan-400" />
                  <span className="text-gray-400">Vectors:</span>
                  <span className="text-white font-medium">+{learningData.vectors.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white font-medium">+{learningData.confidence}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3 text-purple-400" />
                  <span className="text-gray-400">Patterns:</span>
                  <span className="text-white font-medium">+{learningData.patterns}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AILearningFeedback;
