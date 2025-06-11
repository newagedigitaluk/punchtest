
import { Button } from "@/components/ui/button";

interface PaymentControlsProps {
  paymentStatus: 'waiting' | 'processing' | 'success' | 'failed';
  isLoading: boolean;
  onInitiatePayment: () => void;
  onBack: () => void;
  onReset: () => void;
}

const PaymentControls = ({
  paymentStatus,
  isLoading,
  onInitiatePayment,
  onBack,
  onReset
}: PaymentControlsProps) => {
  if (paymentStatus === 'waiting') {
    return (
      <div className="flex gap-8">
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="text-2xl px-16 py-8 bg-gray-800/80 text-white border-2 border-gray-500 hover:bg-gray-700 hover:text-white hover:border-gray-400 transition-all duration-300 rounded-xl backdrop-blur-sm"
        >
          ← Cancel
        </Button>
        
        <Button 
          onClick={onInitiatePayment}
          disabled={isLoading}
          size="lg"
          className="text-2xl px-16 py-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none border-2 border-green-400/30"
        >
          {isLoading ? '⏳ Starting...' : '💳 Start Payment'}
        </Button>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="flex gap-8">
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="text-2xl px-16 py-8 bg-gray-800/80 text-white border-2 border-gray-500 hover:bg-gray-700 hover:text-white hover:border-gray-400 transition-all duration-300 rounded-xl backdrop-blur-sm"
        >
          ← Back
        </Button>
        
        <Button 
          onClick={onReset}
          size="lg"
          className="text-2xl px-16 py-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-400/30"
        >
          🔄 Try Again
        </Button>
      </div>
    );
  }

  return null;
};

export default PaymentControls;
