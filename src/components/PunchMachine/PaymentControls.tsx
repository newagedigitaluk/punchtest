
import { Button } from "@/components/ui/button";

interface PaymentControlsProps {
  paymentStatus: 'waiting' | 'processing' | 'success' | 'failed';
  selectedReaderId: string | null;
  isTestMode: boolean;
  onBack: () => void;
  onInitiatePayment: () => void;
  onSimulatePayment: () => void;
}

const PaymentControls = ({
  paymentStatus,
  selectedReaderId,
  isTestMode,
  onBack,
  onInitiatePayment,
  onSimulatePayment
}: PaymentControlsProps) => {
  if (paymentStatus !== 'waiting') {
    return null;
  }

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
        disabled={!selectedReaderId}
        size="lg"
        className="text-2xl px-12 py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
      >
        💳 Start Payment
      </Button>
    </div>
  );
};

export default PaymentControls;
