
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsePaymentActionsProps {
  selectedReaderId: string | null;
  isTestMode: boolean;
  setPaymentStatus: (status: 'waiting' | 'processing' | 'success' | 'failed') => void;
  setCheckoutId: (id: string | null) => void;
  setError: (error: string) => void;
  onPaymentComplete: () => void;
}

export const usePaymentActions = ({
  selectedReaderId,
  isTestMode,
  setPaymentStatus,
  setCheckoutId,
  setError,
  onPaymentComplete
}: UsePaymentActionsProps) => {
  const [checkoutId, setLocalCheckoutId] = useState<string | null>(null);

  const initiatePayment = async () => {
    if (!selectedReaderId) {
      setError('No SumUp reader selected. Please check SumUp settings.');
      return;
    }

    setPaymentStatus('processing');
    setError('');
    
    try {
      console.log('Creating SumUp payment with webhook support, reader ID:', selectedReaderId);
      
      const { data, error } = await supabase.functions.invoke('sumup-payment', {
        body: {
          amount: 1.00,
          currency: 'GBP',
          isTestMode,
          readerId: selectedReaderId
        }
      });

      if (error) throw error;

      if (data.success) {
        setLocalCheckoutId(data.checkoutId);
        setCheckoutId(data.checkoutId);
        console.log('Payment initiated with webhook support:', data.checkoutId);
        console.log('Webhook URL configured:', data.webhookUrl);
        
        // The payment status will now be updated via real-time webhook
        // No need for polling - the webhook will notify us instantly
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setPaymentStatus('failed');
      setError('Failed to create payment. Please try again.');
    }
  };

  return {
    initiatePayment,
    checkoutId
  };
};
