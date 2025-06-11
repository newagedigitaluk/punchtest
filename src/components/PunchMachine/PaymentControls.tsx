
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
      <div className="flex gap-6">
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="text-2xl px-12 py-6 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
        >
          ← Cancel
        </Button>
        
        <Button 
          onClick={onInitiatePayment}
          disabled={isLoading}
          size="lg"
          className="text-2xl px-12 py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
        >
          {isLoading ? '⏳ Starting...' : '💳 Start Payment'}
        </Button>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="flex gap-6">
        <Button 
          onClick={onBack}
          variant="outline"
          size="lg"
          className="text-2xl px-12 py-6 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
        >
          ← Back
        </Button>
        
        <Button 
          onClick={onReset}
          size="lg"
          className="text-2xl px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl"
        >
          🔄 Try Again
        </Button>
      </div>
    );
  }

  return null;
};

export default PaymentControls;
