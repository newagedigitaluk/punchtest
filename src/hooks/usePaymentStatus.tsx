
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
      statusInterval = setInterval(async () => {
        try {
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
