
import PaymentBackground from "./PaymentBackground";
import PaymentStatusDisplay from "./PaymentStatusDisplay";
import PaymentControls from "./PaymentControls";
import { useWebhookPaymentStatus } from "@/hooks/useWebhookPaymentStatus";
import { useReaderManagement } from "@/hooks/useReaderManagement";
import { usePaymentActions } from "@/hooks/usePaymentActions";

interface PaymentProps {
  onPaymentComplete: () => void;
  onBack: () => void;
}

const Payment = ({ onPaymentComplete, onBack }: PaymentProps) => {
  const isTestMode = true;
  
  const {
    paymentStatus,
    setPaymentStatus,
    countdown,
    error,
    setError,
    resetPayment
  } = useWebhookPaymentStatus({ 
    checkoutId: null, // Will be set after payment initiation
    onPaymentComplete, 
    onBack 
  });

  const {
    availableReaders,
    selectedReaderId,
    error: readerError
  } = useReaderManagement(isTestMode);

  const {
    initiatePayment,
    checkoutId
  } = usePaymentActions({
    selectedReaderId,
    isTestMode,
    setPaymentStatus,
    setCheckoutId: () => {}, // Not needed with webhook approach
    setError,
    onPaymentComplete
  });

  // Combine errors from different sources
  const combinedError = error || readerError;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      <PaymentBackground />

      <div className="text-center animate-fade-in relative z-10 max-w-4xl">
        <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          💳 PAYMENT
        </h1>

        <PaymentStatusDisplay
          paymentStatus={paymentStatus}
          countdown={countdown}
          selectedReaderId={selectedReaderId}
          availableReaders={availableReaders}
          checkoutId={checkoutId}
          isTestMode={isTestMode}
          error={combinedError}
          onRetry={resetPayment}
        />

        <PaymentControls
          paymentStatus={paymentStatus}
          selectedReaderId={selectedReaderId}
          isTestMode={isTestMode}
          onBack={onBack}
          onInitiatePayment={initiatePayment}
          onSimulatePayment={() => {}} // No-op function
        />
      </div>
    </div>
  );
};

export default Payment;
