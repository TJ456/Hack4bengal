// This file contains an improved error UI section for the TransactionInterceptor component
// To apply: Replace the existing "if (error)" block in TransactionInterceptor.tsx with this code

if (error) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-black/90 backdrop-blur-lg border-red-500/30 border-2">
        <CardHeader className="border-b border-red-500/30">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-white">Risk Assessment Issue</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-white">Failed to analyze transaction: {error}</p>
          <p className="text-sm text-yellow-300 mt-2">
            {error.includes('timed out') ? 
              "The ML service is taking too long to respond. You can proceed with caution." : 
              "You can still proceed, but exercise caution."}
          </p>
          <div className="flex space-x-3 justify-center mt-4">
            <Button onClick={onBlock} variant="outline" className="border-red-500/30 hover:bg-red-500/10 text-red-400">
              Cancel Transaction
            </Button>
            <Button onClick={onClose} className="bg-yellow-600 hover:bg-yellow-700">
              Proceed with Caution
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
