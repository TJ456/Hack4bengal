import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Add type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface CapturedImage {
  data: string;
  display: string;
}

interface VerifyResponse {
  success: boolean;
  encodings: any; // Replace 'any' with proper type if known
}

interface RegisterResponse {
  success: boolean;
}

const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRequestRef = useRef<number>();
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);

  // Connect to MetaMask and get wallet address
  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setWalletAddress(accounts[0]);
        } catch (err) {
          console.error('Failed to connect to wallet:', err);
          toast({
            variant: "destructive",
            title: "Wallet Connection Failed",
            description: "Please make sure MetaMask is installed and unlock your wallet.",
          });
        }
      }
    };

    connectWallet();
  }, [toast]);
  // Initialize WebSocket connection for face animation with reconnection
  useEffect(() => {
    function connectWebSocket() {
      const socket = new WebSocket('wss://yugamax-face-ani.hf.space/ws/face');

      socket.onopen = () => {
        setIsWebSocketConnected(true);
        console.log('WebSocket Connected');
      };      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.success && data.face && canvasRef.current) {
            setIsFaceDetected(true);
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            // Clear previous drawing
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            const { x, y, w, h } = data.face;
            
            // Calculate center points
            const centerX = x + w/2;
            const centerY = y + h/2;
            const targetX = canvasRef.current.width/2;
            const targetY = canvasRef.current.height/2;
            
            // Calculate position feedback
            const offsetX = centerX - targetX;
            const offsetY = centerY - targetY;
            
            // Draw target area
            ctx.strokeStyle = '#ffffff44';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              targetX - 100,
              targetY - 150,
              200,
              300
            );
            
            // Draw face detection box
            const isWellPositioned = Math.abs(offsetX) < 50 && Math.abs(offsetY) < 50;
            ctx.strokeStyle = isWellPositioned ? '#00ff00' : '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // Draw position guidance
            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            let guidance = '';
            if (Math.abs(offsetX) > 50) {
              guidance += offsetX > 0 ? 'Move Left • ' : 'Move Right • ';
            }
            if (Math.abs(offsetY) > 50) {
              guidance += offsetY > 0 ? 'Move Up • ' : 'Move Down • ';
            }
            if (guidance === '') {
              guidance = 'Perfect Position! Hold Still...';
            }
            
            ctx.strokeText(guidance, 10, canvasRef.current.height - 20);
            ctx.fillText(guidance, 10, canvasRef.current.height - 20);

            setIsFaceDetected(true);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        setIsWebSocketConnected(false);
        console.log('WebSocket Disconnected');
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = () => {
        console.error('WebSocket error');
        setIsWebSocketConnected(false);
      };

      setWs(socket);
    }

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Start camera when component mounts
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
        });
      }
    };

    startCamera();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [toast]);
  // Send frames to WebSocket for face animation using setInterval
  useEffect(() => {
    if (!ws || !isWebSocketConnected || !videoRef.current || !canvasRef.current) return;

    const sendFrame = () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Set proper dimensions
      tempCanvas.width = 640;
      tempCanvas.height = 480;

      // Draw the video frame
      tempCtx.drawImage(videoRef.current!, 0, 0, 640, 480);

      // Convert to JPEG data URL
      const imageData = tempCanvas.toDataURL('image/jpeg');
      ws.send(imageData);
    };

    // Send frame every 100ms
    const intervalId = setInterval(sendFrame, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [ws, isWebSocketConnected]);
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !isFaceDetected) return;

    // Start countdown
    setCaptureCountdown(3);
    
    // Wait for countdown
    for (let i = 3; i > 0; i--) {
      setCaptureCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCaptureCountdown(null);

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set high resolution
    canvas.width = 1280;  // Doubled for better quality
    canvas.height = 960;  // Doubled for better quality
    
    // Mirror the image horizontally and draw at high resolution
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Get both the display URL and the data for API
    const fullDataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG
    const imageData = fullDataUrl.split(',')[1];

    setCapturedImages(prev => [...prev, {
      data: imageData,
      display: fullDataUrl
    }]);

    toast({
      title: `Image ${capturedImages.length + 1} Captured`,
      description: capturedImages.length === 0 ? "Please capture one more image" : "Images captured successfully!",
    });
  };  const verifyAndRegister = async () => {
    if (capturedImages.length !== 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please capture two images first.",
      });
      return;
    }

    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first.",
      });
      return;
    }

    const image1Data = capturedImages[0]?.data;
    const image2Data = capturedImages[1]?.data;

    if (!image1Data || !image2Data) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Captured image data is missing. Please recapture.",
      });
      return;
    }

    // Validate image sizes
    const minSizeKB = 1; // 1KB
    const maxSizeKB = 10000; // 10MB
    [image1Data, image2Data].forEach((imageData, i) => {
      const sizeKB = (imageData.length * 0.75) / 1024; // base64 to bytes conversion
      if (sizeKB < minSizeKB || sizeKB > maxSizeKB) {
        toast({
          variant: "destructive",
          title: "Image Size Error",
          description: `Image ${i + 1} size (${sizeKB.toFixed(1)}KB) is outside acceptable range (${minSizeKB}KB-${maxSizeKB}KB)`,
        });
        return;
      }
    });

    // Check network connection
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "No internet connection. Please check your network.",
      });
      return;
    }

    // Log image data for debugging
    console.log("Image 1 Data Preview:", image1Data.slice(0, 30) + "...");
    console.log("Image 2 Data Preview:", image2Data.slice(0, 30) + "...");

    setIsProcessing(true);

    try {
      console.log('Starting verification process...');
      console.log('Images to verify:', {
        image1Length: capturedImages[0].data.length,
        image2Length: capturedImages[1].data.length
      });      // First, verify the face images with the required fields
      console.log('Sending verification request with:', {
        username: walletAddress,
        live_image_length: image2Data.length,
      });      // Convert image to blob and create form data
      const fullDataUrl = `data:image/jpeg;base64,${image2Data}`;
      const imageBlob = dataURLtoBlob(fullDataUrl);
      const formData = new FormData();
      formData.append('username', walletAddress.toLowerCase());
      formData.append('live_image', imageBlob, 'live_image.jpg');

      console.log('Verification request:', {
        username: walletAddress.toLowerCase(),
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });      // Add retry logic for verification
      let verifyResult: VerifyResponse | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const verifyResponse = await fetch('https://yugamax-face-recognition-app.hf.space/verify/', {
            method: 'POST',
            body: formData,
          });

          console.log(`Verify attempt ${retryCount + 1} - status:`, verifyResponse.status);
          const verifyResponseText = await verifyResponse.text();
          console.log(`Verify attempt ${retryCount + 1} - response:`, verifyResponseText);

          if (!verifyResponse.ok) {
            throw new Error(`Face verification request failed: ${verifyResponse.status} ${verifyResponseText}`);
          }

          try {
            const result = JSON.parse(verifyResponseText) as VerifyResponse;
            console.log(`Verify attempt ${retryCount + 1} - parsed result:`, result);

            if (result.success) {
              console.log('Verification successful!');
              verifyResult = result;
              break; // Success! Exit the retry loop
            } else {
              console.log(`Verification attempt ${retryCount + 1} failed - face may not be clear enough`);
              throw new Error('Face verification failed - please ensure your face is clearly visible');
            }
          } catch (parseError) {
            console.error(`Failed to parse verification response (attempt ${retryCount + 1}):`, parseError);
            console.log('Raw response that failed to parse:', verifyResponseText);
            throw new Error('Invalid response from verification server: ' + (parseError as Error).message);
          }
        } catch (error) {
          console.error(`Verification attempt ${retryCount + 1} failed:`, error);
          if (retryCount === maxRetries - 1) {
            // On last retry, throw the error
            throw new Error(`Face verification failed after ${maxRetries} attempts. Please ensure good lighting and your face is clearly visible.`);
          }
          // Wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        retryCount++;
      }

      if (!verifyResult) {
        throw new Error('Face verification failed - no successful verification after all attempts');
      }

      console.log('Starting registration process...');      console.log('Registration payload:', {
        username: walletAddress,
        live_image_length: capturedImages[1].data.length,
        wallet_address: walletAddress,
        encodings_length: verifyResult.encodings ? verifyResult.encodings.length : 0
      });      // Final check before registration
      if (!walletAddress || !image2Data) {
        throw new Error('Missing required registration fields.');
      }

      // Log registration payload for debugging
      console.log("Sending registration data:", {
        username: walletAddress,
        live_image_preview: image2Data.slice(0, 30) + "...",
        has_face_encodings: !!verifyResult.encodings
      });      // Create form data for registration
      const registrationFormData = new FormData();
      const registrationImageBlob = dataURLtoBlob(`data:image/jpeg;base64,${image2Data}`);
      
      registrationFormData.append('username', walletAddress.toLowerCase());
      registrationFormData.append('live_image', registrationImageBlob, 'live_image.jpg');
      registrationFormData.append('wallet_address', walletAddress.toLowerCase());
      if (verifyResult.encodings) {
        registrationFormData.append('face_encodings', JSON.stringify(verifyResult.encodings));
      }

      console.log('Registration request:', {
        username: walletAddress.toLowerCase(),
        blobSize: registrationImageBlob.size,
        blobType: registrationImageBlob.type,
        hasEncodings: !!verifyResult.encodings
      });

      const registerResponse = await fetch('https://yugamax-face-recognition-app.hf.space/register/', {
        method: 'POST',
        body: registrationFormData,
      });

      console.log('Register response status:', registerResponse.status);      const registerResponseText = await registerResponse.text();
      console.log('Register response text:', registerResponseText);

      if (!registerResponse.ok) {
        throw new Error(`Registration request failed: ${registerResponse.status} ${registerResponseText}`);
      }

      let registerResult: RegisterResponse;
      try {
        registerResult = JSON.parse(registerResponseText) as RegisterResponse;
      } catch (parseError) {
        console.error('Failed to parse registration response:', parseError);
        console.log('Raw response that failed to parse:', registerResponseText);
        throw new Error('Invalid response from registration server: ' + (parseError as Error).message);
      }
      console.log('Register result:', registerResult);

      if (registerResult.success) {
        setRegistrationCompleted(true);
        toast({
          title: "Registration Successful",
          description: "Your face and wallet have been successfully registered!",
        });
        setTimeout(() => navigate('/'), 2000);
      } else {
        throw new Error('Registration failed - API returned success: false');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred during registration. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImages([]);
  };
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Face Registration</CardTitle>
          <CardDescription>
            Register your face to secure your wallet. You'll need to capture two images.
            <div className={`mt-2 ${isWebSocketConnected ? 'text-green-500' : 'text-red-500'}`}>
              WebSocket: {isWebSocketConnected ? 'Connected' : 'Disconnected'}
            </div>
            {!walletAddress && (
              <div className="text-red-500 mt-2">
                Please connect your wallet to continue.
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                width="640"
                height="480"
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <canvas 
                ref={canvasRef} 
                width="640" 
                height="480" 
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              {capturedImages.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <img
                    src={capturedImages[capturedImages.length - 1].display}
                    alt="Captured"
                    className="max-h-full"
                  />
                </div>
              )}
              
              {/* Face detection status overlay */}
              {!capturedImages.length && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className={`px-4 py-2 rounded-full ${
                    isFaceDetected ? 'bg-green-500' : 'bg-yellow-500'
                  } bg-opacity-75 text-white text-sm`}>
                    {isFaceDetected ? 'Face Detected - Ready to Capture' : 'Position your face in the frame'}
                  </div>
                </div>
              )}

              {/* Capture countdown overlay */}
              {captureCountdown && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white bg-black bg-opacity-50 rounded-full w-24 h-24 flex items-center justify-center">
                    {captureCountdown}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="flex justify-center space-x-4">
                {capturedImages.length < 2 ? (
                  <Button
                    onClick={captureImage}
                    className="w-48"
                    disabled={isProcessing || !walletAddress || !isFaceDetected}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {captureCountdown 
                      ? `Capturing in ${captureCountdown}...`
                      : `Capture Image ${capturedImages.length + 1}`}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={resetCapture}
                      variant="outline"
                      className="w-40"
                      disabled={isProcessing}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      onClick={verifyAndRegister}
                      className="w-40"
                      disabled={isProcessing || !walletAddress}
                    >
                      {isProcessing ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Processing..." : "Register"}
                    </Button>
                  </>
                )}
              </div>

              {!isFaceDetected && !capturedImages.length && (
                <div className="text-yellow-500 text-sm">
                  No face detected. Please ensure your face is clearly visible in the frame.
                </div>
              )}
            </div>

            {registrationCompleted && (
              <div className="text-center text-green-500">
                <Check className="w-8 h-8 mx-auto mb-2" />
                Registration completed successfully!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
