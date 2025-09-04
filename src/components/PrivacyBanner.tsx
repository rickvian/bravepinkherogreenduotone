import { Shield, Lock, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const PrivacyBanner = () => {
  return (
    <Card className="bg-gradient-secondary text-secondary-foreground p-6 mb-8">
      <div className="flex items-center justify-center gap-8 text-center">
        <div className="flex items-center gap-2 flex-col">
          <Cpu className="h-10 w-10" />
          <span className="text-sm font-medium text-sm">100% Browser Processing</span>
        </div>
        <div className="flex items-center gap-2 flex-col">
          <Shield className="h-10 w-10" />
          <span className="text-sm font-medium text-sm">No Uploads</span>
        </div>
        <div className="flex items-center gap-2 flex-col">
          <Lock className="h-10 w-10" />
          <span className="text-sm font-medium text-sm">Your Privacy Protected</span>
        </div>
      </div>
    </Card>
  );
};