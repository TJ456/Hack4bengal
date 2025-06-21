// Configuration file for API endpoints
module.exports = {
  // Use the improved prediction API by default
  PREDICTION_API: 'predict_v3',
  
  // External ML service endpoint
  EXTERNAL_ML_API: 'https://ml-fraud-transaction-detection.onrender.com/predict',
  
  // Timeout settings (in milliseconds)
  ML_TIMEOUT_FIRST_ATTEMPT: 8000,
  ML_TIMEOUT_SECOND_ATTEMPT: 15000,
  ML_MASTER_TIMEOUT: 25000
};
