
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, Award, Zap, Loader2 } from 'lucide-react';
import walletConnector from '@/web3/wallet';
import contractService from '@/web3/contract';

interface SecurityScoreProps {
  defaultScore?: number;
  onLevelUp?: () => void;
}

const SecurityScore: React.FC<SecurityScoreProps> = ({ defaultScore = 65, onLevelUp }) => {
  const [score, setScore] = useState<number>(defaultScore);
  const [level, setLevel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [securityBreakdown, setSecurityBreakdown] = useState({
    threatsBlocked: 0,
    daoVotes: 0,
    reports: 0,
    walletAge: 0
  });
  
  // Load security score data from the smart contract or API
  useEffect(() => {
    const fetchSecurityData = async () => {
      if (!walletConnector.address) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch this data from your contract or backend
        // For now, we'll simulate data based on the real wallet address
        
        // Get the user's reports count
        let reports = 0;
        try {
          const userReports = await contractService.getUserReports();
          reports = userReports.length;
        } catch (err) {
          console.error("Failed to get user reports:", err);
        }
        
        // Get the user's DAO votes - this would be a real function in the future
        // For now, it's mocked
        const daoVotes = Math.floor(Math.random() * 30); // Mock data
        
        // Calculate wallet age - a real implementation would check the first transaction
        // or use a backend service to get this information
        const walletAge = 8; // Mock data
        
        // Simulate threats blocked data
        const threatsBlocked = Math.floor(Math.random() * 40) + 10; // Mock data
        
        // Set the breakdown
        const breakdown = {
          threatsBlocked, 
          daoVotes, 
          reports,
          walletAge
        };
        
        setSecurityBreakdown(breakdown);
        
        // Calculate score based on the breakdown
        const calculatedScore = 
          Math.min(25, threatsBlocked) + 
          Math.min(30, daoVotes * 2) +
          Math.min(20, reports * 5) +
          Math.min(25, walletAge * 3);
        
        setScore(calculatedScore);
        
      } catch (err: any) {
        console.error("Error fetching security data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSecurityData();
    
    // Re-fetch when wallet changes
    const handleAccountChange = () => fetchSecurityData();
    window.addEventListener('wallet_accountChanged', handleAccountChange);
    
    return () => {
      window.removeEventListener('wallet_accountChanged', handleAccountChange);
    };
  }, []);
  
  // Update level when score changes
  useEffect(() => {
    const shieldLevel = getShieldLevel(score);
    setLevel(shieldLevel.level);
  }, [score]);
  const getShieldLevel = (score: number) => {
    if (score >= 90) return { level: 'Guardian Elite', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', icon: '🛡️⭐' };
    if (score >= 75) return { level: 'Shield Master', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: '🛡️💎' };
    if (score >= 60) return { level: 'Defender', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: '🛡️⚡' };
    if (score >= 40) return { level: 'Guardian', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: '🛡️' };
    return { level: 'Rookie', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', icon: '🛡️🌱' };
  };

  const shieldData = getShieldLevel(score);
  const nextLevelScore = Math.ceil(score / 15) * 15;
  const progressToNext = ((score % 15) / 15) * 100;

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5"></div>
      <CardHeader className="relative">
        <CardTitle className="flex items-center space-x-3 text-white">
          <div className="relative">
            <Shield className="h-6 w-6 text-cyan-400" />
            <div className="absolute -top-1 -right-1 text-xs">{shieldData.icon.slice(-1)}</div>
          </div>
          <span>Security Shield Level</span>
        </CardTitle>
      </CardHeader>      <CardContent className="relative space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mr-2" />
            <p className="text-gray-400">Calculating security score...</p>
          </div>
        ) : !walletConnector.address ? (
          <div className="py-6 text-center">
            <p className="text-gray-400">Connect your wallet to view your security level</p>
          </div>
        ) : (
          <>
            {/* Main Score Display */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{score}</div>
                <Badge className={shieldData.color}>
                  {shieldData.icon} {shieldData.level}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Next Level</div>
                <div className="text-lg font-semibold text-cyan-400">{nextLevelScore}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress to next level</span>
                <span className="text-cyan-400">{Math.round(progressToNext)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                ></div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-gray-400">Threats Blocked:</span>
                <span className="text-white font-medium">+{securityBreakdown.threatsBlocked}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-400">DAO Votes:</span>
                <span className="text-white font-medium">+{securityBreakdown.daoVotes}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-gray-400">Reports:</span>
                <span className="text-white font-medium">+{securityBreakdown.reports}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="text-gray-400">Wallet Age:</span>
                <span className="text-white font-medium">+{securityBreakdown.walletAge}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityScore;
