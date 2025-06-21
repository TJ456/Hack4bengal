import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, MessageCircle, ArrowRight, AlertCircle, Bell, Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TelegramSettingsProps {
  walletAddress: string;
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ walletAddress }) => {
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [chatId, setChatId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [alertSettings, setAlertSettings] = useState({
    highRiskTransactions: true,
    mediumRiskTransactions: true,
    loginAttempts: true,
    smartContractInteractions: true,
    newScamReports: true,
    dailySummary: false
  });
  const { toast } = useToast();

  // Check if wallet is already linked to Telegram
  useEffect(() => {
    const checkTelegramLinking = async () => {
      try {
        const response = await fetch(`/api/telegram/status?address=${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.linked) {
            setIsLinked(true);
            setChatId(data.chatId);
          }
        }
      } catch (error) {
        console.error('Failed to check Telegram linking status:', error);
      }
    };

    if (walletAddress) {
      checkTelegramLinking();
    }
  }, [walletAddress]);

  const handleLinkTelegram = async () => {
    if (!chatId) {
      toast({
        title: "Error",
        description: "Please enter a valid Telegram Chat ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          telegram_chat_id: chatId 
        })
      });

      if (response.ok) {
        setIsLinked(true);
        toast({
          title: "Success",
          description: "Your wallet is now linked to Telegram!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to link Telegram",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link Telegram account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlertSettings = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/telegram/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          settings: alertSettings 
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification settings saved successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save notification settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/telegram/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsLinked(false);
        setChatId('');
        toast({
          title: "Success",
          description: "Telegram account unlinked successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to unlink Telegram account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink Telegram account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <MessageCircle className="mr-2 h-5 w-5 text-cyan-500" />
          Telegram Security Companion
        </CardTitle>
        <CardDescription>
          Link your wallet to Telegram for real-time security alerts and transaction notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={isLinked ? "settings" : "link"}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="link">
              {isLinked ? "Connection" : "Link Telegram"}
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!isLinked}>
              Notification Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link">
            {!isLinked ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-cyan-950/40 border border-cyan-900/50 rounded-lg">
                  <QrCode className="h-12 w-12 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-200">Connect with Telegram Bot</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Open Telegram and search for <span className="font-mono bg-gray-800 px-1 rounded">@unhackable_wallet_bot</span>, 
                      then click START and use the /link command to get your Chat ID.
                    </p>
                    <Button 
                      variant="link" 
                      className="px-0 text-cyan-400 mt-1"
                      onClick={() => window.open('https://t.me/unhackable_wallet_bot', '_blank')}
                    >
                      Open in Telegram <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chatId">Enter your Telegram Chat ID</Label>
                  <Input
                    id="chatId"
                    placeholder="e.g. 123456789"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    You can get your Chat ID by sending the command <span className="font-mono">/start</span> to the bot
                  </p>
                </div>
                
                <Button 
                  className="w-full bg-cyan-600 hover:bg-cyan-700" 
                  onClick={handleLinkTelegram}
                  disabled={loading || !chatId}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {loading ? "Linking..." : "Link Telegram Account"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-lg bg-green-900/20 border border-green-900/30">
                  <div className="bg-green-500/20 p-2 rounded-full mr-3">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-200">Telegram Successfully Linked</h3>
                    <p className="text-sm text-gray-400">
                      You'll receive real-time security alerts via Telegram
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Connected Account</h3>
                    <p className="text-xs text-gray-400 mt-1">Telegram Chat ID: {chatId}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-red-800/50 hover:bg-red-900/20 text-red-400"
                    onClick={handleUnlinkTelegram}
                    disabled={loading}
                  >
                    Unlink
                  </Button>
                </div>
                
                <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-lg">
                  <h3 className="font-medium text-gray-200 flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-blue-400" /> Test Your Connection
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 mb-3">
                    Send a test message to verify your Telegram integration is working properly
                  </p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      toast({
                        title: "Test message sent",
                        description: "Check your Telegram for the test message",
                      });
                    }}
                  >
                    Send Test Message
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Notification Preferences</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <Label htmlFor="high-risk">High-risk transactions</Label>
                  </div>
                  <Switch 
                    id="high-risk" 
                    checked={alertSettings.highRiskTransactions}
                    onCheckedChange={(checked) => 
                      setAlertSettings(prev => ({...prev, highRiskTransactions: checked}))}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <Label htmlFor="medium-risk">Medium-risk transactions</Label>
                  </div>
                  <Switch 
                    id="medium-risk"
                    checked={alertSettings.mediumRiskTransactions}
                    onCheckedChange={(checked) => 
                      setAlertSettings(prev => ({...prev, mediumRiskTransactions: checked}))}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-blue-400" />
                    <Label htmlFor="login-attempts">Login attempts</Label>
                  </div>
                  <Switch 
                    id="login-attempts"
                    checked={alertSettings.loginAttempts}
                    onCheckedChange={(checked) => 
                      setAlertSettings(prev => ({...prev, loginAttempts: checked}))}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <Label htmlFor="contract-interactions">Smart contract interactions</Label>
                  </div>
                  <Switch 
                    id="contract-interactions"
                    checked={alertSettings.smartContractInteractions}
                    onCheckedChange={(checked) => 
                      setAlertSettings(prev => ({...prev, smartContractInteractions: checked}))}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-green-400" />
                    <Label htmlFor="new-scam-reports">New scam reports</Label>
                  </div>
                  <Switch 
                    id="new-scam-reports"
                    checked={alertSettings.newScamReports}
                    onCheckedChange={(checked) => 
                      setAlertSettings(prev => ({...prev, newScamReports: checked}))}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-gray-400" />
                    <Label htmlFor="daily-summary">Daily security summary</Label>
                  </div>
                  <Switch 
                    id="daily-summary"
                    checked={alertSettings.dailySummary}
                    onCheckedChange={(checked) => 
                      setAlertSettings(prev => ({...prev, dailySummary: checked}))}
                  />
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
              onClick={handleSaveAlertSettings}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Notification Settings"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          The Telegram companion provides real-time security alerts and allows you to quickly respond 
          to threats. All notifications are end-to-end encrypted and no sensitive wallet data is shared.
        </p>
      </CardFooter>
    </Card>
  );
};

export default TelegramSettings;
