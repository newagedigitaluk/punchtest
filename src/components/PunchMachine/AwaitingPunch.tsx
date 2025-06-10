
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface AwaitingPunchProps {
  onPunchDetected: (power: number) => void;
  onTimeout: () => void;
}

const AwaitingPunch = ({ onPunchDetected, onTimeout }: AwaitingPunchProps) => {
  const [countdown, setCountdown] = useState(30);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial 3-second countdown before machine is ready
    const readyTimer = setTimeout(() => {
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (isReady && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onTimeout();
    }
  }, [countdown, isReady, onTimeout]);

  const simulatePunch = () => {
    // Simulate punch detection with random power between 50-999 kg
    const power = Math.floor(Math.random() * 950) + 50;
    onPunchDetected(power);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center text-white p-8">
      <div className="text-center animate-fade-in">
        {!isReady ? (
          <>
            <h1 className="text-6xl font-bold mb-8 text-yellow-400">
              GET READY!
            </h1>
            <div className="text-8xl mb-8 animate-pulse">🥊</div>
            <p className="text-3xl">Machine activating...</p>
          </>
        ) : (
          <>
            <h1 className="text-6xl font-bold mb-8 text-yellow-400">
              PUNCH NOW!
            </h1>
            
            <div className="bg-black/50 rounded-lg p-8 mb-8">
              <div className="text-8xl mb-6 animate-bounce">🎯</div>
              <h2 className="text-4xl font-semibold mb-6">
                Hit the Target!
              </h2>
              <p className="text-2xl mb-4">
                Punch as hard as you can
              </p>
              <p className="text-xl opacity-75 mb-6">
                You have one credit - make it count!
              </p>
              
              <div className="text-3xl font-bold text-red-400">
                Time left: {countdown}s
              </div>
            </div>

            {/* Mock punch button for testing */}
            <Button 
              onClick={simulatePunch}
              size="lg"
              className="text-2xl px-12 py-6 bg-red-600 hover:bg-red-500 rounded-full"
            >
              Simulate Punch (Test)
            </Button>

            <div className="mt-8 text-sm opacity-60">
              <p>Punch straight at the target</p>
              <p>Keep your wrist straight</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AwaitingPunch;
