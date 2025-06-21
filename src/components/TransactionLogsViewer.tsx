import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Function to retrieve transaction logs from localStorage
const getTransactionLogs = () => {
  try {
    const logs = localStorage.getItem('transaction-logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error retrieving transaction logs:', error);
    return [];
  }
};

// Transaction Logs View component
const TransactionLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  
  useEffect(() => {
    setLogs(getTransactionLogs());
    
    // Set up event listener to refresh logs when new transactions are processed
    const handleNewTransaction = () => {
      setLogs(getTransactionLogs());
    };
    
    window.addEventListener('transaction-logged', handleNewTransaction);
    
    // Check for logs every few seconds
    const interval = setInterval(() => {
      setLogs(getTransactionLogs());
    }, 5000);
    
    return () => {
      window.removeEventListener('transaction-logged', handleNewTransaction);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <Card className="w-full bg-black/30 backdrop-blur-sm border-white/10">
      <CardHeader className="border-b border-white/10">
        <CardTitle>Transaction Security Log</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center p-4">No transaction security logs available</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {logs.map((log, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  log.blocked 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : log.riskLevel === 'High'
                      ? 'bg-orange-500/10 border border-orange-500/30'
                      : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex justify-between text-sm">
                  <span>To: {log.to.substring(0, 6)}...{log.to.substring(log.to.length - 4)}</span>
                  <span className={
                    log.riskLevel === 'High' 
                      ? 'text-red-400' 
                      : log.riskLevel === 'Medium' 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                  }>
                    {log.riskLevel} Risk - {log.riskScore.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{log.value} ETH</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionLogsViewer;
