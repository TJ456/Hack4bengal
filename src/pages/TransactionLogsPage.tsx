import React from 'react';
import TransactionLogsViewer from '@/components/TransactionLogsViewer';

const TransactionLogsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <h1 className="text-2xl font-bold mb-6">Transaction Security Logs</h1>
      <p className="text-gray-400 mb-6">
        This page shows a history of transaction risk assessments performed by the ML model. 
        You can see the risk score for each transaction and whether it was blocked or allowed.
      </p>
      
      <TransactionLogsViewer />
      
      <div className="mt-8 p-4 bg-black/30 border border-white/10 rounded-lg">
        <h2 className="text-xl font-bold mb-2">About Transaction Risk Assessment</h2>
        <p className="text-gray-400 mb-4">
          Every transaction is analyzed by our machine learning model to detect potential fraud or security risks.
          The model evaluates the following factors:
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Transaction amount and gas price</li>
          <li>Whether the recipient is a contract</li>
          <li>Your transaction history patterns</li>
          <li>Known scam addresses</li>
          <li>Whitelisted addresses you've trusted</li>
        </ul>
        <p className="text-gray-400 mt-4">
          High-risk transactions will be blocked or require explicit confirmation before proceeding.
        </p>
      </div>
    </div>
  );
};

export default TransactionLogsPage;
