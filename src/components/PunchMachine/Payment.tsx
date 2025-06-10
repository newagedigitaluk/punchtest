
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface PaymentProps {
  onPaymentComplete: () => void;
  onBack: () => void;
}

const Payment = ({ onPaymentComplete, onBack }: PaymentProps) => {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (paymentStatus === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onBack(); // Timeout - go back to start
    }
  }, [countdown, paymentStatus, onBack]);

  const simulatePayment = () => {
    setPaymentStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
    }, 3000);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-5 right-5 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-5 left-5 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="text-center animate-fade-in relative z-10">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          💳 PAYMENT
        </h1>

        {paymentStatus === 'waiting' && (
          <>
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-blue-500/30 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-blue-300">
                Ready to Test Your Power?
              </h2>
              <div className="text-4xl mb-4 animate-bounce">💳</div>
              <p className="text-2xl mb-3 font-bold text-yellow-400">Cost: £1.00</p>
              <p className="text-lg opacity-90 mb-4">
                Tap your card on the reader or insert/swipe when ready
              </p>
              
              {/* Mock SumUp reader indicator */}
              <div className="bg-gradient-to-r from-green-500 to-green-400 text-black px-6 py-3 rounded-xl font-bold text-lg mb-4 shadow-lg">
                🟢 CARD READER READY
              </div>
              
              <p className="text-sm opacity-70 bg-gray-800/50 rounded-lg p-2">
                Time remaining: <span className="font-bold text-red-400">{countdown}s</span>
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={onBack}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
              >
                ← Cancel
              </Button>
              
              {/* Mock payment button for testing */}
              <Button 
                onClick={simulatePayment}
                size="lg"
                className="text-lg px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                💰 Simulate Payment (Test)
              </Button>
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">
              Processing Payment...
            </h2>
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-lg">Please wait while we process your payment</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-green-400">
              Payment Successful!
            </h2>
            <div className="text-4xl mb-4 animate-bounce">✅</div>
            <p className="text-lg">Get ready to punch!</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-red-500/30 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              Payment Failed
            </h2>
            <div className="text-4xl mb-4 animate-pulse">❌</div>
            <p className="text-lg mb-4">Please try again</p>
            <Button 
              onClick={() => setPaymentStatus('waiting')}
              size="lg"
              className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl"
            >
              🔄 Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
