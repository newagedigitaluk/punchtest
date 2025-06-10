
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsePaymentStatusProps {
  onPaymentComplete: () => void;
  onBack: () => void;
}

export const usePaymentStatus = ({ onPaymentComplete, onBack }: UsePaymentStatusProps) => {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting');
  const [countdown, setCountdown] = useState(60);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onBack(); // Timeout - go back to start
    }
  }, [countdown, paymentStatus, onBack]);

  // Payment status polling
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    
    if (paymentStatus === 'processing' && checkoutId) {
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts over ~80 seconds (3s delay + 4s intervals)
      
      const checkStatus = async () => {
        attempts++;
        try {
          console.log(`Payment status check attempt ${attempts}/${maxAttempts} for checkout ${checkoutId}`);
          
          const { data, error } = await supabase.functions.invoke('sumup-status', {
            body: { 
              checkoutId, 
              isTestMode: true,
              checkAttempt: attempts 
            }
          });

          if (error) throw error;

          console.log('Payment status check response:', data);

          if (data.status === 'PAID' || data.simulated) {
            console.log('Payment successful! Transitioning to success state.');
            setPaymentStatus('success');
            setTimeout(() => {
              onPaymentComplete();
            }, 2000);
            return;
          } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
            setPaymentStatus('failed');
            setError('Payment was cancelled or failed');
            return;
          }
          
          // If we've reached max attempts, treat as failed
          if (attempts >= maxAttempts) {
            console.log('Max payment status check attempts reached - payment verification timed out');
            setPaymentStatus('failed');
            setError('Payment verification timed out. Please check your SumUp reader and try again.');
            return;
          }
          
        } catch (err) {
          console.error('Status check failed:', err);
          if (attempts >= maxAttempts) {
            setPaymentStatus('failed');
            setError('Payment verification failed. Please try again.');
          }
        }
      };

      // Start checking after 3 seconds, then every 4 seconds
      const initialDelay = setTimeout(() => {
        checkStatus();
        statusInterval = setInterval(checkStatus, 4000);
      }, 3000);
      
      return () => {
        clearTimeout(initialDelay);
        if (statusInterval) clearInterval(statusInterval);
      };
    }
  }, [paymentStatus, checkoutId, onPaymentComplete]);

  const resetPayment = () => {
    setPaymentStatus('waiting');
    setError('');
    setCheckoutId(null);
  };

  return {
    paymentStatus,
    setPaymentStatus,
    countdown,
    checkoutId,
    setCheckoutId,
    error,
    setError,
    resetPayment
  };
};
