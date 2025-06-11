
import { useState } from 'react';
import PaymentBackground from './PaymentBackground';
import PaymentStatusDisplay from './PaymentStatusDisplay';
import PaymentControls from './PaymentControls';
import { useWebhookPaymentStatus } from '@/hooks/useWebhookPaymentStatus';
import { usePaymentActions } from '@/hooks/usePaymentActions';
import { useReaderManagement } from '@/hooks/useReaderManagement';

interface PaymentProps {
  onPaymentComplete: () => void;
  onBack: () => void;
}

const Payment = ({ onPaymentComplete, onBack }: PaymentProps) => {
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  
  // Get test mode from localStorage (set in admin settings)
  const isTestMode = localStorage.getItem('sumupTestMode') === 'true';

  const { availableReaders, selectedReaderId, error: readerError } = useReaderManagement(isTestMode);

  const { paymentStatus, setPaymentStatus, countdown, error, setError, resetPayment } = useWebhookPaymentStatus({
    checkoutId,
    onPaymentComplete: () => {
      // Store checkout ID for punch results listening
      if (checkoutId) {
        console.log('Storing checkout ID for punch results:', checkoutId);
        sessionStorage.setItem('currentCheckoutId', checkoutId);
      }
      onPaymentComplete();
    },
    onBack
  });

  const { initiatePayment, isLoading } = usePaymentActions({
    onPaymentInitiated: (id: string) => {
      console.log('Payment initiated with ID:', id);
      setCheckoutId(id);
      setPaymentStatus('processing');
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      setPaymentStatus('failed');
    },
    readerId: selectedReaderId || undefined,
    isTestMode
  });

  const handleInitiatePayment = () => {
    if (!selectedReaderId) {
      setError('No SumUp reader selected. Please ensure a reader is paired.');
      setPaymentStatus('failed');
      return;
    }

    console.log('Initiating payment process with reader:', selectedReaderId);
    resetPayment();
    initiatePayment();
  };

  const handleBack = () => {
    // Clear any stored checkout ID when going back
    sessionStorage.removeItem('currentCheckoutId');
    onBack();
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <PaymentBackground />
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
        <PaymentStatusDisplay 
          paymentStatus={paymentStatus}
          countdown={countdown}
          error={error || readerError}
          checkoutId={checkoutId}
          selectedReaderId={selectedReaderId}
          availableReaders={availableReaders}
          isTestMode={isTestMode}
          onRetry={resetPayment}
        />
        
        <PaymentControls
          paymentStatus={paymentStatus}
          isLoading={isLoading}
          onInitiatePayment={handleInitiatePayment}
          onBack={handleBack}
          onReset={resetPayment}
        />
      </div>
    </div>
  );
};

export default Payment;
