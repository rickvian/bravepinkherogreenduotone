import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Palette, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface ImageProcessorProps {
  processedImageUrl: string | null;
  onImageProcessed: (imageUrl: string | null) => void;
  currentFile: File | null;
  onFileChange: (file: File | null) => void;
  isFullscreen?: boolean;
}

export const ImageProcessor = ({ processedImageUrl, onImageProcessed, currentFile, onFileChange, isFullscreen = false }: ImageProcessorProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pinkIntensity, setPinkIntensity] = useState([70]);
  const [greenIntensity, setGreenIntensity] = useState([70]);
  const [contrast, setContrast] = useState([100]);
  const [brightness, setBrightness] = useState([100]);
  const [controlsExpanded, setControlsExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const processImage = useCallback(async (file: File, settings?: {
    pinkIntensity?: number;
    greenIntensity?: number;
    contrast?: number;
    brightness?: number;
  }) => {
    const finalSettings = {
      pinkIntensity: settings?.pinkIntensity ?? pinkIntensity[0],
      greenIntensity: settings?.greenIntensity ?? greenIntensity[0],
      contrast: settings?.contrast ?? contrast[0],
      brightness: settings?.brightness ?? brightness[0]
    };
    setProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Resize for performance while maintaining aspect ratio
      const maxDimension = 1200;
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) throw new Error('Failed to get image data');

      const data = imageData.data;
      
      // Apply enhanced duotone processing
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to grayscale using luminance formula
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Apply proper contrast adjustment (pivot around 128)
        const contrastFactor = finalSettings.contrast / 100;
        let adjustedGray = ((gray - 128) * contrastFactor) + 128;
        
        // Apply brightness adjustment
        const brightnessAdjust = (finalSettings.brightness - 100) * 1.28; // Scale for better effect
        adjustedGray += brightnessAdjust;
        
        // Clamp values
        adjustedGray = Math.min(255, Math.max(0, adjustedGray));
        
        // Create a more pronounced S-curve for better contrast
        let normalizedGray = adjustedGray / 255;
        // Apply S-curve to enhance mid-tone separation
        normalizedGray = normalizedGray < 0.5 
          ? 2 * normalizedGray * normalizedGray 
          : 1 - 2 * (1 - normalizedGray) * (1 - normalizedGray);
        
        // Apply intensity controls with better color preservation
        const pinkFactor = finalSettings.pinkIntensity / 100;
        const greenFactor = finalSettings.greenIntensity / 100;
        
        // Create more balanced color transitions
        let blendRatio;
        if (normalizedGray < 0.4) {
          // Dark areas - stronger green dominance
          blendRatio = (normalizedGray / 0.4) * 0.15 * greenFactor;
        } else if (normalizedGray > 0.8) {
          // Bright areas - more controlled pink
          blendRatio = 0.5 + ((normalizedGray - 0.8) / 0.2) * 0.35 * pinkFactor;
        } else {
          // Mid-tones - favor green more
          const midFactor = (normalizedGray - 0.4) / 0.4;
          blendRatio = 0.15 + midFactor * 0.35;
        }
        
        // Define more saturated duotone colors
        // Hero Green - deeper, more saturated
        const greenR = 15;
        const greenG = 85;
        const greenB = 45;
        
        // Brave Pink - more vibrant
        const pinkR = 255;
        const pinkG = 95;
        const pinkB = 200;
        
        // Enhanced color mixing with individual saturation control
        const duotoneR = Math.round(greenR + (pinkR - greenR) * blendRatio);
        const duotoneG = Math.round(greenG + (pinkG - greenG) * blendRatio);
        const duotoneB = Math.round(greenB + (pinkB - greenB) * blendRatio);
        
        // Apply individual saturation based on which color dominates
        let finalR, finalG, finalB;
        if (blendRatio < 0.5) {
          // Green dominant - apply green saturation control
          const greenSaturation = greenFactor;
          finalR = Math.round(adjustedGray + (duotoneR - adjustedGray) * greenSaturation);
          finalG = Math.round(adjustedGray + (duotoneG - adjustedGray) * greenSaturation);
          finalB = Math.round(adjustedGray + (duotoneB - adjustedGray) * greenSaturation);
        } else {
          // Pink dominant - apply pink saturation control
          const pinkSaturation = pinkFactor;
          finalR = Math.round(adjustedGray + (duotoneR - adjustedGray) * pinkSaturation);
          finalG = Math.round(adjustedGray + (duotoneG - adjustedGray) * pinkSaturation);
          finalB = Math.round(adjustedGray + (duotoneB - adjustedGray) * pinkSaturation);
        }
        
        data[i] = Math.min(255, Math.max(0, finalR));
        data[i + 1] = Math.min(255, Math.max(0, finalG));
        data[i + 2] = Math.min(255, Math.max(0, finalB));
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      ctx?.putImageData(imageData, 0, 0);
      
      // Get processed image without compression
      const processedDataUrl = canvas.toDataURL('image/png');
      
      // Append timestamp hash to force image re-render
      const imageUrlWithHash = `${processedDataUrl}#${Date.now()}`;
      
      onImageProcessed(imageUrlWithHash);
      

    } catch (error) {
      toast("Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [pinkIntensity, greenIntensity, contrast, brightness]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFile = (file: File) => {
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      toast("File too large! Maximum size is 50MB.");
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast("Unsupported format! Please use JPEG, PNG, or WebP.");
      return;
    }
    
    onFileChange(file);
    processImage(file);
  };



  // Debounced auto-apply when sliders change
  useEffect(() => {

    if (!currentFile) {
      return;
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for auto-apply
    debounceRef.current = setTimeout(() => {
      processImage(currentFile, {
        pinkIntensity: pinkIntensity[0],
        greenIntensity: greenIntensity[0],
        contrast: contrast[0],
        brightness: brightness[0]
      });
    }, 300);

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [pinkIntensity, greenIntensity, contrast, brightness, processImage]);

  const downloadImage = () => {
    if (!processedImageUrl) return;
    
    // Remove hash from URL for download
    const cleanUrl = processedImageUrl.split('#')[0];
    
    const link = document.createElement('a');
    link.download = 'brave-pink-hero-green-processed.png';
    link.href = cleanUrl;
    link.click();
    toast("Image downloaded! 📸");
  };

  const clearImage = () => {
    onImageProcessed(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Normal layout (not fullscreen)
  if (!isFullscreen) {
    return (
      <div className="space-y-4">
        {/* Drop Zone - Only show when no image */}
        {!processedImageUrl && (
          <Card 
            className={`border-2 border-dashed transition-all duration-300 ${
              dragActive 
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="p-8 md:p-12 text-center">
              <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drop your image here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports JPEG, PNG, WebP up to 50MB
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFile(e.target.files?.[0]!)}
              />
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Fullscreen layout
  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-900">
      {/* Background Image */}
 
      {processedImageUrl && (
        <img 
          src={processedImageUrl}
          alt="Background"
          className="absolute inset-0 w-full h-full object-contain object-top"
        />
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-16 left-4 text-white text-xs bg-black/50 p-2 rounded">
          Processed Image: {processedImageUrl ? 'exists' : 'null'}<br/>
          Fullscreen: {isFullscreen ? 'true' : 'false'}
        </div>
      )}
      
      {/* Fallback if no image */}
      {!processedImageUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg opacity-50">Loading image...</p>
          </div>
        </div>
      )}
      
      {/* Close Button */}
      <Button
        onClick={clearImage}
        variant="outline"
        size="sm"
        className="absolute top-4 right-4 z-50 bg-black/20 backdrop-blur-sm border-white/20 text-white hover:bg-black/40"
      >
        <X className="h-4 w-4" />
      </Button>

            {/* Collapsible Controls Overlay */}
      <div className="absolute inset-0 flex flex-col items-center">
        {/* Controls Panel with Glass Effect */}
        <div 
          className={`transition-all duration-300 bg-black/20 backdrop-blur-lg border-t border-white/10 absolute w-full max-w-[400px] bottom-[74px] ${
            controlsExpanded ? 'flex-1' : 'flex-none'
          }`
        } 
          data-testid="control-panel"
        >
          <div>
            {/* Toggle Header */}
            <button
              onClick={() => setControlsExpanded(!controlsExpanded)}
              className="w-full p-4 flex items-center justify-between text-white hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <span className="font-medium">Adjust Colors</span>
              </div>
              {controlsExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>

            {/* Expandable Content */}
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                controlsExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6 space-y-6 pb-10">
                {/* Sliders */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-white flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-pink-300" />
                        Pink Intensity
                      </span>
                      <span className="text-pink-300 font-bold">{pinkIntensity[0]}%</span>
                    </label>
                    <Slider
                      value={pinkIntensity}
                      onValueChange={setPinkIntensity}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-green-300" />
                        Green Intensity
                      </span>
                      <span className="text-green-300 font-bold">{greenIntensity[0]}%</span>
                    </label>
                    <Slider
                      value={greenIntensity}
                      onValueChange={setGreenIntensity}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white flex items-center justify-between mb-3">
                      <span>Contrast</span>
                      <span className="text-white font-bold">{contrast[0]}%</span>
                    </label>
                    <Slider
                      value={contrast}
                      onValueChange={setContrast}
                      min={50}
                      max={150}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white flex items-center justify-between mb-3">
                      <span>Brightness</span>
                      <span className="text-white font-bold">{brightness[0]}%</span>
                    </label>
                    <Slider
                      value={brightness}
                      onValueChange={setBrightness}
                      min={50}
                      max={150}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div data-testid="floating-button-container" className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 backdrop-blur-sm border-t border-white/10">
        <div className="flex gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <Upload className="h-4 w-4 mr-2" />
            New Image
          </Button>
          <Button
            onClick={downloadImage}
            disabled={!processedImageUrl || processing}
            className="flex-1 bg-gradient-primary hover:shadow-glow"
          >
            <Download className="h-4 w-4 mr-2" />
            {processing ? 'Processing...' : 'Download'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0]!)}
          />
        </div>
      </div>
    </div>
  );
};