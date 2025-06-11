
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsePaymentActionsProps {
  onPaymentInitiated: (id: string) => void;
  onError: (errorMessage: string) => void;
}

export const usePaymentActions = ({
  onPaymentInitiated,
  onError
}: UsePaymentActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async () => {
    setIsLoading(true);
    
    try {
      console.log('Creating SumUp payment with webhook support');
      
      const { data, error } = await supabase.functions.invoke('sumup-payment', {
        body: {
          amount: 1.00,
          currency: 'GBP',
          isTestMode: true, // You can make this configurable later
          readerId: 'test-reader' // You can make this configurable later
        }
      });

      if (error) throw error;

      if (data.success) {
        const clientTransactionId = data.clientTransactionId;
        console.log('Payment initiated with webhook support:', clientTransactionId);
        console.log('Webhook URL configured:', data.webhookUrl);
        onPaymentInitiated(clientTransactionId);
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      onError('Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    isLoading
  };
};
