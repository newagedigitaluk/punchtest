
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
    <div className="h-screen w-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-5 right-5 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-5 left-5 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="text-center animate-fade-in relative z-10 max-w-4xl">
        <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          💳 PAYMENT
        </h1>

        {paymentStatus === 'waiting' && (
          <>
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-blue-500/30 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-300">
                Ready to Test Your Power?
              </h2>
              <div className="text-6xl mb-6 animate-bounce">💳</div>
              <p className="text-3xl mb-4 font-bold text-yellow-400">Cost: £1.00</p>
              <p className="text-2xl opacity-90 mb-6">
                Tap your card on the reader or insert/swipe when ready
              </p>
              
              {/* Mock SumUp reader indicator */}
              <div className="bg-gradient-to-r from-green-500 to-green-400 text-black px-8 py-4 rounded-xl font-bold text-2xl mb-6 shadow-lg">
                🟢 CARD READER READY
              </div>
              
              <p className="text-lg opacity-70 bg-gray-800/50 rounded-lg p-3">
                Time remaining: <span className="font-bold text-red-400">{countdown}s</span>
              </p>
            </div>

            <div className="flex gap-6">
              <Button 
                onClick={onBack}
                variant="outline"
                size="lg"
                className="text-2xl px-12 py-6 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
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
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-yellow-500/30 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400">
              Processing Payment...
            </h2>
            <div className="text-6xl mb-6 animate-spin">⏳</div>
            <p className="text-2xl">Please wait while we process your payment</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-green-500/30 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-green-400">
              Payment Successful!
            </h2>
            <div className="text-6xl mb-6 animate-bounce">✅</div>
            <p className="text-2xl">Get ready to punch!</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-red-500/30 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-red-400">
              Payment Failed
            </h2>
            <div className="text-6xl mb-6 animate-pulse">❌</div>
            <p className="text-2xl mb-6">Please try again</p>
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
