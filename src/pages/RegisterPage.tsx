import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Mode = 'select' | 'register' | 'verify';
type RegistrationStep = 'capture1' | 'confirm1' | 'capture2' | 'confirm2' | 'complete';
type VerificationStep = 'capture' | 'confirm' | 'complete';

// Add type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface VerifyResponse {
  success: boolean;
  encodings: any; // Replace 'any' with proper type if known
}

interface RegisterResponse {
  success: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();  const [mode, setMode] = useState<Mode>('register'); // Start directly in register mode
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('capture1');
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('capture');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [verifyImage, setVerifyImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Connect to MetaMask and get wallet address
  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setUsername(accounts[0]); // Use wallet address as username
          startCamera(); // Start camera after wallet connection
        } catch (err) {
          console.error('Failed to connect to wallet:', err);
          toast({
            variant: "destructive",
            title: "Wallet Connection Failed",
            description: "Please make sure MetaMask is installed and unlock your wallet.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "MetaMask Not Found",
          description: "Please install MetaMask to continue.",
        });
      }
    };

    connectWallet();
  }, [toast]);

  // Mirror video feed
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.style.transform = 'scaleX(-1)';
    }
  }, [mode, registrationStep]);
  // Start/stop camera when registration step changes
  useEffect(() => {
    if (username && (registrationStep === 'capture1' || registrationStep === 'capture2')) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [username, registrationStep]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.transform = 'scaleX(-1)';
      }
    } catch (error) {
      setMessage('❌ Camera access denied. Please allow camera permissions.');
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCapture = () => {
    const photoData = capturePhoto();
    if (!photoData) return;

    if (mode === 'register') {
      if (registrationStep === 'capture1') {
        setImage1(photoData);
        setRegistrationStep('confirm1');
      } else if (registrationStep === 'capture2') {
        setImage2(photoData);
        setRegistrationStep('confirm2');
      }
    } else if (mode === 'verify') {
      setVerifyImage(photoData);
      setVerificationStep('confirm');
    }
  };

  const handleRetake = () => {
    if (mode === 'register') {
      if (registrationStep === 'confirm1') {
        setImage1(null);
        setRegistrationStep('capture1');
      } else if (registrationStep === 'confirm2') {
        setImage2(null);
        setRegistrationStep('capture2');
      }
    } else if (mode === 'verify') {
      setVerifyImage(null);
      setVerificationStep('capture');
    }
  };

  const handleConfirm = () => {
    if (mode === 'register') {
      if (registrationStep === 'confirm1') {
        setRegistrationStep('capture2');
        startCamera();
      } else if (registrationStep === 'confirm2') {
        handleRegister();
      }
    } else if (mode === 'verify') {
      handleVerify();
    }
  };

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
  const handleRegister = async () => {
    if (!username.trim() || !image1 || !image2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter username and capture both images",
      });
      return;
    }

    setLoading(true);
    setMessage('⏳ Registering user...');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('image1', dataURLtoBlob(image1), 'image1.jpg');
      formData.append('image2', dataURLtoBlob(image2), 'image2.jpg');

      const response = await fetch('https://yugamax-face-recognition-app.hf.space/register/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${data.message || 'Registration successful!'}`);
        toast({
          title: "Success",
          description: data.message || "Registration successful!",
        });
        setRegistrationStep('complete');
        setTimeout(() => navigate('/'), 2000);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('❌ Network error. Please try again.');
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!username.trim() || !verifyImage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter username and capture image",
      });
      return;
    }

    setLoading(true);
    setMessage('🔍 Verifying...');

    try {
      const formData = new FormData();
      formData.append('username', username.toLowerCase());
      formData.append('live_image', dataURLtoBlob(verifyImage), 'live.jpg');

      const response = await fetch('https://yugamax-face-recognition-app.hf.space/verify/', {
        method: 'POST',
        body: formData
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Unexpected server response. Please try again.');
      }

      if (response.ok && data.success) {
        setMessage(`✅ Verification successful!`);
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified!",
        });
        setVerificationStep('complete');
        setTimeout(() => navigate('/'), 2000);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred during verification. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setMode('select');
    setRegistrationStep('capture1');
    setVerificationStep('capture');
    setMessage('');
    setImage1(null);
    setImage2(null);
    setVerifyImage(null);
    setLoading(false);
    navigate('/');
  };  const renderCamera = () => (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-black/40 border border-white/20 shadow-lg backdrop-blur-sm">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-[480px] object-cover"
        />
        {/* Scanning animation */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanning line */}
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-75 animate-scanning-line"></div>
          
          {/* Dots overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(0,255,0,0.1)_20%)] bg-[length:10px_10px] animate-dots-fade"></div>
          
          {/* Corner markers */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-gray-400"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-gray-400"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-gray-400"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-gray-400"></div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );  const renderCapturedImage = (imageSrc: string) => (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm">
        <img src={imageSrc} alt="Captured" className="w-full h-[480px] object-cover" />
        <div className="absolute inset-0 border border-green-400/50 rounded-xl pointer-events-none shadow-[inset_0_0_20px_rgba(74,222,128,0.2)]"></div>
      </div>
    </div>
  );return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-cyan-500/30 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <Card className="bg-black/20 backdrop-blur-lg border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Face Registration
              </span>
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            </CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Register your face to secure your wallet using biometric authentication.
              {!username && (
                <div className="mt-2 text-red-400 bg-red-950/50 p-2 rounded-lg border border-red-500/20 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></div>
                  Please connect your wallet to continue.
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="mb-6">
                {(registrationStep === 'capture1' || registrationStep === 'capture2') && renderCamera()}
                {registrationStep === 'confirm1' && image1 && renderCapturedImage(image1)}
                {registrationStep === 'confirm2' && image2 && renderCapturedImage(image2)}
              </div>              {message && (
                <div className="mb-6 p-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg text-center text-gray-300 shadow-lg">
                  {message}
                </div>
              )}

              <div className="space-y-3">
                {(registrationStep === 'capture1' || registrationStep === 'capture2') && (
                  <Button
                    onClick={handleCapture}
                    disabled={loading || !username}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] py-6 text-lg rounded-xl"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    <span>Capture Photo {registrationStep === 'capture1' ? '1' : '2'}</span>
                  </Button>
                )}

                {(registrationStep === 'confirm1' || registrationStep === 'confirm2') && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleRetake}
                      variant="outline"
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 backdrop-blur-sm shadow-lg transform transition-all duration-300 hover:scale-[1.02] py-6 text-lg rounded-xl"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      <span>Retake</span>
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] py-6 text-lg rounded-xl"
                    >
                      <Check className="mr-2 h-5 w-5" />
                      <span>{registrationStep === 'confirm2' ? 'Register' : 'Next'}</span>
                    </Button>
                  </div>
                )}

                {loading && (
                  <div className="flex justify-center">
                    <RotateCcw className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
