
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

  // Payment status polling with longer intervals and timeout
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let statusTimeout: NodeJS.Timeout;
    
    if (paymentStatus === 'processing' && checkoutId) {
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts over 2 minutes
      
      const checkStatus = async () => {
        attempts++;
        try {
          console.log(`Payment status check attempt ${attempts}/${maxAttempts} for checkout ${checkoutId}`);
          
          const { data, error } = await supabase.functions.invoke('sumup-status', {
            body: { checkoutId, isTestMode: true }
          });

          if (error) throw error;

          console.log('Payment status check:', data);

          if (data.status === 'PAID') {
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
          
          // If we've reached max attempts, show timeout message
          if (attempts >= maxAttempts) {
            console.log('Max payment status check attempts reached');
            setPaymentStatus('failed');
            setError('Payment status check timed out. Please try again.');
            return;
          }
          
        } catch (err) {
          console.error('Status check failed:', err);
          if (attempts >= maxAttempts) {
            setPaymentStatus('failed');
            setError('Failed to check payment status');
          }
        }
      };

      // Start checking immediately, then every 4 seconds
      checkStatus();
      statusInterval = setInterval(checkStatus, 4000);
      
      // Set overall timeout to 2 minutes
      statusTimeout = setTimeout(() => {
        if (statusInterval) clearInterval(statusInterval);
        setPaymentStatus('failed');
        setError('Payment check timed out. Please try again.');
      }, 120000); // 2 minutes
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (statusTimeout) clearTimeout(statusTimeout);
    };
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
