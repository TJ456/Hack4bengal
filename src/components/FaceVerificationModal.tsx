import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, Check, Loader2 } from 'lucide-react';

interface FaceVerificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  walletAddress: string;
}

const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  onClose,
  onSuccess,
  onError,
  walletAddress
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturing, setCapturing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = () => {
    if (webcamRef.current) {
      setCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setCapturing(false);
    }
  };

  const verifyFace = async () => {
    if (!capturedImage) return;

    setVerifying(true);
    try {
      // Convert base64 image to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('wallet_address', walletAddress);

      // Send to Yugamax API
      const verificationResponse = await fetch('https://yugamax-face-recognition-app.hf.space/verify/', {
        method: 'POST',
        body: formData
      });

      if (!verificationResponse.ok) {
        throw new Error('Verification failed');
      }

      const result = await verificationResponse.json();
      
      if (result.success) {
        onSuccess();
      } else {
        onError('Face verification failed. Please try again.');
      }
    } catch (error) {
      onError('An error occurred during face verification. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const tryAgain = () => {
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur border-white/20">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">Face Verification Required</h2>
            <p className="text-gray-400">Please verify your identity to proceed with the transaction</p>
          </div>

          <div className="relative w-full aspect-video bg-black/40 rounded-lg overflow-hidden">
            {!capturedImage ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}

            {/* Animated scanning effect */}
            <div className="absolute inset-0">
              <div className="w-full h-1 bg-cyan-500/50 animate-scan-line" />
              <div className="absolute inset-0 animate-scan-dots" style={{
                background: `radial-gradient(circle at center, rgba(34, 211, 238, 0.2) 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }} />
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!capturedImage ? (
              <Button 
                onClick={capture}
                disabled={capturing}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {capturing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Capture Photo
              </Button>
            ) : (
              <>
                <Button 
                  onClick={tryAgain}
                  variant="outline"
                  disabled={verifying}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={verifyFace}
                  disabled={verifying}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {verifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Verify Identity
                </Button>
              </>
            )}
            <Button 
              onClick={onClose}
              variant="outline"
              disabled={verifying}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FaceVerificationModal;
