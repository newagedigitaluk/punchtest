
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
    <div className="h-screen bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-36 h-36 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="text-center animate-fade-in relative z-10">
        {!isReady ? (
          <>
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
              GET READY!
            </h1>
            <div className="text-5xl mb-4 animate-pulse">🥊</div>
            <p className="text-2xl font-bold text-green-300">Machine activating...</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400 animate-pulse">
              PUNCH NOW!
            </h1>
            
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-red-500/30 shadow-2xl">
              <div className="text-5xl mb-4 animate-bounce">🎯</div>
              <h2 className="text-2xl font-bold mb-4 text-red-300">
                Hit the Target!
              </h2>
              <p className="text-lg mb-3 font-bold">
                Punch as hard as you can
              </p>
              <p className="text-base opacity-90 mb-4 text-yellow-300">
                You have one credit - make it count!
              </p>
              
              <div className="text-2xl font-bold text-red-400 bg-gray-900/50 rounded-xl p-3">
                ⏰ Time left: {countdown}s
              </div>
            </div>

            {/* Mock punch button for testing */}
            <Button 
              onClick={simulatePunch}
              size="lg"
              className="text-lg px-12 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-200 border-4 border-yellow-400"
            >
              🥊 Simulate Punch (Test)
            </Button>

            <div className="mt-4 text-sm opacity-80 bg-gray-800/30 rounded-lg p-3">
              <p className="mb-1">💡 Punch straight at the target</p>
              <p>💪 Keep your wrist straight</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AwaitingPunch;
