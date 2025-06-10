
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseWebhookPaymentStatusProps {
  checkoutId: string | null;
  onPaymentComplete: () => void;
  onBack: () => void;
}

export const useWebhookPaymentStatus = ({ 
  checkoutId, 
  onPaymentComplete, 
  onBack 
}: UseWebhookPaymentStatusProps) => {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting');
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string>('');

  // Countdown timer for timeout
  useEffect(() => {
    if (paymentStatus === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onBack(); // Timeout - go back to start
    }
  }, [countdown, paymentStatus, onBack]);

  // Real-time webhook listener
  useEffect(() => {
    if (!checkoutId || paymentStatus !== 'processing') {
      return;
    }

    console.log(`Setting up real-time listener for payment: ${checkoutId}`);
    
    const channelName = `payment-${checkoutId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'payment_update' }, (payload) => {
        console.log('Received real-time payment update:', payload);
        
        const { status, transactionId, amount, currency, source } = payload.payload;
        
        console.log(`Payment update: ${status} for transaction ${transactionId} (source: ${source})`);

        if (status === 'SUCCESSFUL' || status === 'PAID' || status === 'COMPLETED') {
          console.log('Payment successful! Transitioning to success state.');
          setPaymentStatus('success');
          setTimeout(() => {
            onPaymentComplete();
          }, 2000);
        } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'DECLINED') {
          console.log('Payment failed or cancelled');
          setPaymentStatus('failed');
          setError('Payment was cancelled or failed');
        }
      })
      .subscribe((status) => {
        console.log(`Real-time subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${channelName}`);
        }
      });

    // Set a maximum timeout for webhook delivery (2 minutes)
    const webhookTimeout = setTimeout(() => {
      console.log('Webhook timeout reached - no payment update received');
      setPaymentStatus('failed');
      setError('Payment verification timed out. Please ensure payment was completed and try again.');
    }, 120000); // 2 minutes

    return () => {
      console.log(`Unsubscribing from ${channelName}`);
      channel.unsubscribe();
      clearTimeout(webhookTimeout);
    };
  }, [checkoutId, paymentStatus, onPaymentComplete]);

  const resetPayment = () => {
    setPaymentStatus('waiting');
    setError('');
  };

  return {
    paymentStatus,
    setPaymentStatus,
    countdown,
    error,
    setError,
    resetPayment
  };
};
