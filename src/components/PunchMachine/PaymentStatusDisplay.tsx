
import { Button } from "@/components/ui/button";

interface PaymentStatusDisplayProps {
  paymentStatus: 'waiting' | 'processing' | 'success' | 'failed';
  countdown: number;
  selectedReaderId: string | null;
  availableReaders: any[];
  checkoutId: string | null;
  isTestMode: boolean;
  error: string;
  onRetry: () => void;
}

const PaymentStatusDisplay = ({
  paymentStatus,
  countdown,
  selectedReaderId,
  availableReaders,
  checkoutId,
  isTestMode,
  error,
  onRetry
}: PaymentStatusDisplayProps) => {
  if (paymentStatus === 'waiting') {
    return (
      <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-blue-500/30 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-blue-300">
          Ready to Test Your Power?
        </h2>
        <div className="text-6xl mb-6 animate-bounce">💳</div>
        <p className="text-3xl mb-4 font-bold text-yellow-400">Cost: £1.00</p>
        
        <div className="mb-6">
          <div className="bg-green-500/20 text-green-300 px-6 py-3 rounded-xl font-bold text-xl mb-4 border border-green-500/30">
            {isTestMode ? '🧪 TEST MODE' : '🔴 LIVE MODE'}
          </div>
          
          {selectedReaderId ? (
            <>
              <p className="text-2xl opacity-90 mb-4">
                Payment will be sent to your SumUp reader
              </p>
              <div className="bg-gradient-to-r from-green-500 to-green-400 text-black px-8 py-4 rounded-xl font-bold text-2xl mb-4 shadow-lg">
                🟢 READER READY: {availableReaders.find(r => r.id === selectedReaderId)?.name || 'SumUp Reader'}
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-r from-red-500 to-red-400 text-white px-8 py-4 rounded-xl font-bold text-2xl mb-4 shadow-lg">
              ❌ NO READER FOUND
            </div>
          )}
        </div>
        
        <p className="text-lg opacity-70 bg-gray-800/50 rounded-lg p-3">
          Time remaining: <span className="font-bold text-red-400">{countdown}s</span>
        </p>
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-yellow-500/30 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-yellow-400">
          Processing Payment...
        </h2>
        <div className="text-6xl mb-6 animate-spin">⏳</div>
        <p className="text-2xl mb-4">Complete payment on your SumUp reader</p>
        {checkoutId && (
          <p className="text-sm opacity-70">Payment ID: {checkoutId}</p>
        )}
        {selectedReaderId && (
          <p className="text-lg opacity-90 mt-4 bg-blue-500/20 rounded-lg p-3">
            Reader: {availableReaders.find(r => r.id === selectedReaderId)?.name || selectedReaderId}
          </p>
        )}
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-green-500/30 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-green-400">
          Payment Successful!
        </h2>
        <div className="text-6xl mb-6 animate-bounce">✅</div>
        <p className="text-2xl">Get ready to punch!</p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-red-500/30 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-red-400">
          Payment Failed
        </h2>
        <div className="text-6xl mb-6 animate-pulse">❌</div>
        <p className="text-2xl mb-4">{error || 'Please try again'}</p>
        <Button 
          onClick={onRetry}
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

export default PaymentStatusDisplay;
