import { ImageProcessor } from '@/components/ImageProcessor';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { Palette, Sparkles, Github, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Index = () => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const hasImage = !!processedImageUrl;

  return (
    <div className={`min-h-screen ${hasImage ? 'h-screen overflow-hidden' : 'bg-background'}`}>

      {/* Fullscreen layout when image is selected */}
      {!hasImage ? <>
          <div className="bg-gradient-hero text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Palette className="h-8 w-8" />
                <h1 className="text-4xl md:text-6xl font-bold">
                  Brave Pink <span className="text-secondary-foreground">Hero Green</span>
                </h1>
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
                Transform your images with stunning tone mapping. 
                Bright areas get Brave Pink, dark areas get Hero Green.
              </p>
            </div>
          </div>

          {/* Main Content - Normal layout when no image */}
          <div className="container mx-auto px-4 py-12">
            <PrivacyBanner />
            <ImageProcessor 
              processedImageUrl={processedImageUrl}
              onImageProcessed={setProcessedImageUrl}
              currentFile={currentFile}
              onFileChange={setCurrentFile}
            />
          </div>

          {/* Footer */}
          <footer className="border-t mt-16 py-8">
            <div className="container mx-auto px-4">
              {/* Privacy Message */}
              <div className="text-center text-muted-foreground mb-6">
                <p>✨ All processing happens in your browser - no uploads, maximum privacy ✨</p>
              </div>
              
              {/* Open Source Section */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
  
                  <span className="text-sm text-muted-foreground">
                    Open source  Built by <span className="font-medium text-foreground">rickvian</span>
                  </span>
      
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background hover:bg-muted"
                    onClick={() => window.open('https://github.com/rickvian/bravepinkherogreenduotone', '_blank')}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    View Source Code
                  </Button>
                </div>
                

              </div>
            </div>
          </footer>
        </> : (
        <div className="h-screen w-screen fixed inset-0">
          <ImageProcessor 
            processedImageUrl={processedImageUrl}
            onImageProcessed={(imageUrl)=>{
              setProcessedImageUrl(imageUrl)
            }}
            currentFile={currentFile}
            onFileChange={setCurrentFile}
            isFullscreen={true} 
          />
        </div>
      )}
    </div>
  );
};

export default Index;
