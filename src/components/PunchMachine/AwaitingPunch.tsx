
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { usePunchResults } from "@/hooks/usePunchResults";

interface AwaitingPunchProps {
  onPunchDetected: (power: number) => void;
  onTimeout: () => void;
}

const AwaitingPunch = ({ onPunchDetected, onTimeout }: AwaitingPunchProps) => {
  const [countdown, setCountdown] = useState(30);
  const [isReady, setIsReady] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  
  // Get test mode from localStorage
  const isTestMode = localStorage.getItem('sumupTestMode') === 'true';

  // Get the checkout ID from sessionStorage (set during payment)
  useEffect(() => {
    const storedCheckoutId = sessionStorage.getItem('currentCheckoutId');
    console.log('Retrieved checkout ID from session:', storedCheckoutId);
    setCheckoutId(storedCheckoutId);
  }, []);

  // Use the punch results hook to listen for real punch data
  const { punchStatus, startWaitingForPunch } = usePunchResults({
    checkoutId,
    onPunchComplete: (force: number) => {
      console.log('Real punch detected with force:', force);
      onPunchDetected(force);
    }
  });

  useEffect(() => {
    // Initial 3-second countdown before machine is ready
    const readyTimer = setTimeout(() => {
      setIsReady(true);
      // Start listening for punch results when ready
      if (checkoutId) {
        console.log('Starting to wait for punch results for checkout:', checkoutId);
        startWaitingForPunch();
      }
    }, 3000);

    return () => clearTimeout(readyTimer);
  }, [checkoutId, startWaitingForPunch]);

  useEffect(() => {
    // Only use countdown timer in test mode
    if (isTestMode && isReady && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTestMode && countdown === 0) {
      onTimeout();
    }
  }, [countdown, isReady, onTimeout, isTestMode]);

  // Handle timeout from punch results hook (only in test mode)
  useEffect(() => {
    if (isTestMode && punchStatus === 'timeout') {
      console.log('Punch timeout detected');
      onTimeout();
    }
  }, [punchStatus, onTimeout, isTestMode]);

  const simulatePunch = () => {
    // Simulate punch detection with random power between 50-999 kg
    const power = Math.floor(Math.random() * 950) + 50;
    console.log('Simulated punch with force:', power);
    onPunchDetected(power);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-36 h-36 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="text-center animate-fade-in relative z-10 max-w-4xl">
        {!isReady ? (
          <>
            <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
              GET READY!
            </h1>
            <div className="text-8xl mb-6 animate-pulse">🥊</div>
            <p className="text-3xl font-bold text-green-300">Machine activating...</p>
          </>
        ) : (
          <>
            <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400 animate-pulse">
              PUNCH NOW!
            </h1>
            
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-red-500/30 shadow-2xl">
              <div className="text-8xl mb-6 animate-bounce">🎯</div>
              <h2 className="text-4xl font-bold mb-6 text-red-300">
                Hit the Target!
              </h2>
              <p className="text-2xl mb-4 font-bold">
                Punch as hard as you can
              </p>
              <p className="text-xl opacity-90 mb-6 text-yellow-300">
                You have one credit - make it count!
              </p>
              
              {isTestMode && (
                <div className="text-4xl font-bold text-red-400 bg-gray-900/50 rounded-xl p-4">
                  ⏰ Time left: {countdown}s
                </div>
              )}

              {isTestMode && checkoutId && (
                <div className="mt-4 text-lg text-green-300 bg-gray-900/30 rounded-lg p-3">
                  🔗 Listening for punch from machine (ID: {checkoutId.slice(0, 8)}...)
                </div>
              )}

              {isTestMode && punchStatus === 'waiting' && (
                <div className="mt-4 text-lg text-blue-300 bg-gray-900/30 rounded-lg p-3">
                  ⏳ Waiting for punch results...
                </div>
              )}
            </div>

            {/* Mock punch button for testing - only show in test mode */}
            {isTestMode && (
              <Button 
                onClick={simulatePunch}
                size="lg"
                className="text-2xl px-16 py-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-200 border-4 border-yellow-400"
              >
                🥊 Simulate Punch (Test)
              </Button>
            )}

            <div className="mt-6 text-lg opacity-80 bg-gray-800/30 rounded-lg p-4">
              <p className="mb-2">💡 Punch straight at the target</p>
              <p>💪 Keep your wrist straight</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AwaitingPunch;
