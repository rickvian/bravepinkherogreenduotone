import { Shield, Lock, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const PrivacyBanner = () => {
  return (
    <Card className="bg-gradient-secondary text-secondary-foreground p-6 mb-8">
      <div className="flex items-center justify-center gap-8 text-center">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          <span className="text-sm font-medium">100% Browser Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-medium">No Uploads</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <span className="text-sm font-medium">Your Privacy Protected</span>
        </div>
      </div>
    </Card>
  );
};