
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center text-white p-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-bold mb-8 text-yellow-400">
          PAYMENT
        </h1>

        {paymentStatus === 'waiting' && (
          <>
            <div className="bg-black/50 rounded-lg p-8 mb-8">
              <h2 className="text-3xl font-semibold mb-6">
                Ready to Test Your Power?
              </h2>
              <div className="text-6xl mb-6">💳</div>
              <p className="text-2xl mb-4">Cost: £2.00</p>
              <p className="text-lg opacity-75 mb-6">
                Tap your card on the reader or insert/swipe when ready
              </p>
              
              {/* Mock SumUp reader indicator */}
              <div className="bg-green-500 text-black px-6 py-3 rounded-lg font-semibold text-xl mb-6">
                CARD READER READY
              </div>
              
              <p className="text-sm opacity-60">
                Time remaining: {countdown}s
              </p>
            </div>

            <div className="flex gap-6">
              <Button 
                onClick={onBack}
                variant="outline"
                size="lg"
                className="text-xl px-8 py-4"
              >
                Cancel
              </Button>
              
              {/* Mock payment button for testing */}
              <Button 
                onClick={simulatePayment}
                size="lg"
                className="text-xl px-8 py-4 bg-green-600 hover:bg-green-500"
              >
                Simulate Payment (Test)
              </Button>
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="bg-black/50 rounded-lg p-8">
            <h2 className="text-3xl font-semibold mb-6">
              Processing Payment...
            </h2>
            <div className="text-6xl mb-6 animate-pulse">⏳</div>
            <p className="text-xl">Please wait while we process your payment</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-black/50 rounded-lg p-8">
            <h2 className="text-3xl font-semibold mb-6 text-green-400">
              Payment Successful!
            </h2>
            <div className="text-6xl mb-6">✅</div>
            <p className="text-xl">Get ready to punch!</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-black/50 rounded-lg p-8">
            <h2 className="text-3xl font-semibold mb-6 text-red-400">
              Payment Failed
            </h2>
            <div className="text-6xl mb-6">❌</div>
            <p className="text-xl mb-6">Please try again</p>
            <Button 
              onClick={() => setPaymentStatus('waiting')}
              size="lg"
              className="text-xl px-8 py-4"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
