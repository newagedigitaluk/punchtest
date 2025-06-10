
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentProps {
  onPaymentComplete: () => void;
  onBack: () => void;
}

const Payment = ({ onPaymentComplete, onBack }: PaymentProps) => {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting');
  const [countdown, setCountdown] = useState(60);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(true); // This would come from admin settings
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (paymentStatus === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onBack(); // Timeout - go back to start
    }
  }, [countdown, paymentStatus, onBack]);

  // Poll payment status when processing
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    
    if (paymentStatus === 'processing' && checkoutId) {
      statusInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('sumup-status', {
            body: { checkoutId, isTestMode }
          });

          if (error) throw error;

          console.log('Payment status check:', data);

          if (data.status === 'PAID') {
            setPaymentStatus('success');
            setTimeout(() => {
              onPaymentComplete();
            }, 2000);
          } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
            setPaymentStatus('failed');
            setError('Payment was cancelled or failed');
          }
        } catch (err) {
          console.error('Status check failed:', err);
        }
      }, 2000); // Check every 2 seconds
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [paymentStatus, checkoutId, isTestMode, onPaymentComplete]);

  const initiatePayment = async () => {
    setPaymentStatus('processing');
    setError('');
    
    try {
      console.log('Creating SumUp payment...');
      
      const { data, error } = await supabase.functions.invoke('sumup-payment', {
        body: {
          amount: 1.00,
          currency: 'GBP',
          isTestMode
        }
      });

      if (error) throw error;

      if (data.success) {
        setCheckoutId(data.checkoutId);
        console.log('Payment initiated:', data.checkoutId);
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setPaymentStatus('failed');
      setError('Failed to create payment. Please try again.');
    }
  };

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
              
              <div className="mb-6">
                <div className="bg-green-500/20 text-green-300 px-6 py-3 rounded-xl font-bold text-xl mb-4 border border-green-500/30">
                  {isTestMode ? '🧪 TEST MODE' : '🔴 LIVE MODE'}
                </div>
                <p className="text-2xl opacity-90 mb-4">
                  Present your card to the SumUp reader
                </p>
                <div className="bg-gradient-to-r from-green-500 to-green-400 text-black px-8 py-4 rounded-xl font-bold text-2xl mb-4 shadow-lg">
                  🟢 SUMUP READER READY
                </div>
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
              
              <Button 
                onClick={initiatePayment}
                size="lg"
                className="text-2xl px-12 py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                💳 Start Payment
              </Button>
              
              {/* Mock payment button for testing */}
              {isTestMode && (
                <Button 
                  onClick={simulatePayment}
                  size="lg"
                  className="text-xl px-8 py-6 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold rounded-xl shadow-xl"
                >
                  🎯 Mock Payment
                </Button>
              )}
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 border border-yellow-500/30 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400">
              Processing Payment...
            </h2>
            <div className="text-6xl mb-6 animate-spin">⏳</div>
            <p className="text-2xl mb-4">Please complete payment on the card reader</p>
            {checkoutId && (
              <p className="text-sm opacity-70">Payment ID: {checkoutId}</p>
            )}
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
            <p className="text-2xl mb-4">{error || 'Please try again'}</p>
            <Button 
              onClick={() => {
                setPaymentStatus('waiting');
                setError('');
                setCheckoutId(null);
              }}
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
