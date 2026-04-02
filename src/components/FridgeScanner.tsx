import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { geminiService } from '../services/geminiService';
import { Camera, RefreshCw, Sparkles, Loader2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  user: User;
  onRecipesFound: () => void;
}

export default function FridgeScanner({ user, onRecipesFound }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleScan = async () => {
    if (!image) return;
    setIsScanning(true);
    try {
      const base64 = image.split(',')[1];
      const found = await geminiService.analyzeFridgeImage(base64);
      setIngredients(found);
      
      // Automatically trigger recipe suggestion if ingredients found
      if (found.length > 0) {
        const recipes = await geminiService.suggestRecipes(found);
        localStorage.setItem('last_ingredients', JSON.stringify(found));
        localStorage.setItem('last_recipes', JSON.stringify(recipes));
        onRecipesFound();
      }
    } catch (error) {
      console.error("Scan error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Scan Your Fridge</h2>
        <p className="text-stone-500">Take a photo of your ingredients to get started.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-sm aspect-[3/4] bg-stone-200 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
          <AnimatePresence mode="wait">
            {showCamera ? (
              <motion.div 
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-stone-200 shadow-lg active:scale-90 transition-all"
                  />
                </div>
              </motion.div>
            ) : image ? (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <img src={image} className="w-full h-full object-cover" alt="Fridge" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"
                >
                  <X size={20} />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                  <Camera size={40} />
                </div>
                <p className="text-stone-400 text-sm font-medium">No photo captured yet.</p>
                <button 
                  onClick={startCamera}
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all"
                >
                  Open Camera
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {image && !isScanning && (
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={handleScan}
          className="w-full bg-stone-900 text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
        >
          <Sparkles size={24} className="text-orange-400" />
          Analyze Ingredients
        </motion.button>
      )}

      {isScanning && (
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
          <p className="text-stone-500 font-medium animate-pulse">AI is identifying your food...</p>
        </div>
      )}
    </div>
  );
}
