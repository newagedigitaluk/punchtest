
import { Button } from "@/components/ui/button";

interface PaymentStatusDisplayProps {
  paymentStatus: 'waiting' | 'processing' | 'success' | 'failed';
  countdown: number;
  error: string;
  checkoutId: string | null;
  selectedReaderId: string | null;
  availableReaders: any[];
  isTestMode: boolean;
  onRetry: () => void;
}

const PaymentStatusDisplay = ({
  paymentStatus,
  countdown,
  error,
  checkoutId,
  selectedReaderId,
  availableReaders,
  isTestMode,
  onRetry
}: PaymentStatusDisplayProps) => {
  if (paymentStatus === 'waiting') {
    return (
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-12 mb-8 border border-green-400/30 shadow-2xl max-w-2xl">
        <h2 className="text-4xl font-bold mb-8 text-green-400 text-center">
          Ready to Test Your Power?
        </h2>
        
        <div className="text-center mb-8">
          <div className="text-8xl mb-6 animate-bounce">💳</div>
          <p className="text-4xl mb-6 font-bold text-yellow-400">Cost: £1.00</p>
        </div>
        
        <div className="space-y-4 mb-8">
          {isTestMode && (
            <div className="bg-orange-500/20 text-orange-300 px-6 py-4 rounded-xl font-bold text-xl text-center border border-orange-500/30">
              🧪 TEST MODE - No real charges
            </div>
          )}
          
          {!isTestMode && (
            <div className="bg-green-500/20 text-green-300 px-6 py-4 rounded-xl font-bold text-xl text-center border border-green-500/30">
              💰 LIVE MODE - Real payment required
            </div>
          )}
          
          <p className="text-2xl text-center text-blue-300">
            Payment will be processed via SumUp
          </p>
          
          {selectedReaderId && (
            <div className="bg-blue-500/20 text-blue-300 px-6 py-3 rounded-lg text-lg text-center border border-blue-500/30">
              Reader: {selectedReaderId}
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-xl text-red-400 bg-black/30 rounded-lg p-4 border border-red-400/30">
            Time remaining: <span className="font-bold text-2xl">{countdown}s</span>
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-12 border border-yellow-500/30 shadow-2xl max-w-2xl">
        <h2 className="text-4xl font-bold mb-8 text-yellow-400 text-center">
          Processing Payment...
        </h2>
        <div className="text-center">
          <div className="text-8xl mb-8 animate-spin">⏳</div>
          <p className="text-2xl mb-6 text-yellow-300">Complete payment on your SumUp reader</p>
          {checkoutId && (
            <p className="text-lg opacity-70 mb-2">Payment ID: {checkoutId}</p>
          )}
          {selectedReaderId && (
            <p className="text-lg opacity-70">Reader: {selectedReaderId}</p>
          )}
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-12 border border-green-500/30 shadow-2xl max-w-2xl">
        <h2 className="text-4xl font-bold mb-8 text-green-400 text-center">
          Payment Successful!
        </h2>
        <div className="text-center">
          <div className="text-8xl mb-8 animate-bounce">✅</div>
          <p className="text-2xl text-green-300">Get ready to punch!</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-12 border border-red-500/30 shadow-2xl max-w-2xl">
        <h2 className="text-4xl font-bold mb-8 text-red-400 text-center">
          Payment Failed
        </h2>
        <div className="text-center">
          <div className="text-8xl mb-8 animate-pulse">❌</div>
          <p className="text-2xl mb-6 text-red-300">{error || 'Please try again'}</p>
          
          {!selectedReaderId && availableReaders.length === 0 && (
            <p className="text-lg text-orange-400 bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
              No SumUp readers found. Please ensure a reader is paired.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentStatusDisplay;
