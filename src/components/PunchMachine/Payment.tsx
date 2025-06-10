
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="text-center animate-fade-in relative z-10">
        <h1 className="text-7xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          💳 PAYMENT
        </h1>

        {paymentStatus === 'waiting' && (
          <>
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-10 mb-8 border border-blue-500/30 shadow-2xl">
              <h2 className="text-4xl font-bold mb-8 text-blue-300">
                Ready to Test Your Power?
              </h2>
              <div className="text-8xl mb-8 animate-bounce">💳</div>
              <p className="text-4xl mb-6 font-bold text-yellow-400">Cost: £1.00</p>
              <p className="text-2xl opacity-90 mb-8">
                Tap your card on the reader or insert/swipe when ready
              </p>
              
              {/* Mock SumUp reader indicator */}
              <div className="bg-gradient-to-r from-green-500 to-green-400 text-black px-8 py-4 rounded-xl font-bold text-2xl mb-8 shadow-lg">
                🟢 CARD READER READY
              </div>
              
              <p className="text-lg opacity-70 bg-gray-800/50 rounded-lg p-4">
                Time remaining: <span className="font-bold text-red-400">{countdown}s</span>
              </p>
            </div>

            <div className="flex gap-8">
              <Button 
                onClick={onBack}
                variant="outline"
                size="lg"
                className="text-2xl px-12 py-6 bg-gray-800/50 text-gray-200 border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
              >
                ← Cancel
              </Button>
              
              {/* Mock payment button for testing */}
              <Button 
                onClick={simulatePayment}
                size="lg"
                className="text-2xl px-12 py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                💰 Simulate Payment (Test)
              </Button>
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-10 border border-yellow-500/30 shadow-2xl">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">
              Processing Payment...
            </h2>
            <div className="text-8xl mb-8 animate-spin">⏳</div>
            <p className="text-2xl">Please wait while we process your payment</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-10 border border-green-500/30 shadow-2xl">
            <h2 className="text-4xl font-bold mb-8 text-green-400">
              Payment Successful!
            </h2>
            <div className="text-8xl mb-8 animate-bounce">✅</div>
            <p className="text-2xl">Get ready to punch!</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-10 border border-red-500/30 shadow-2xl">
            <h2 className="text-4xl font-bold mb-8 text-red-400">
              Payment Failed
            </h2>
            <div className="text-8xl mb-8 animate-pulse">❌</div>
            <p className="text-2xl mb-8">Please try again</p>
            <Button 
              onClick={() => setPaymentStatus('waiting')}
              size="lg"
              className="text-2xl px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl"
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
