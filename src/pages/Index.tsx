
import { useState } from "react";
import Screensaver from "@/components/PunchMachine/Screensaver";
import Disclaimer from "@/components/PunchMachine/Disclaimer";
import Payment from "@/components/PunchMachine/Payment";
import AwaitingPunch from "@/components/PunchMachine/AwaitingPunch";
import Results from "@/components/PunchMachine/Results";

type GameState = 'screensaver' | 'disclaimer' | 'payment' | 'awaiting_punch' | 'results';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('screensaver');
  const [punchPower, setPunchPower] = useState<number>(0);

  const handleStart = () => {
    setGameState('disclaimer');
  };

  const handleDisclaimerAccept = () => {
    setGameState('payment');
  };

  const handlePaymentComplete = () => {
    setGameState('awaiting_punch');
  };

  const handlePunchDetected = (power: number) => {
    setPunchPower(power);
    setGameState('results');
  };

  const handleRestart = () => {
    // Restart game from payment (for another punch)
    setGameState('payment');
  };

  const handleReset = () => {
    // Reset to beginning
    setGameState('screensaver');
    setPunchPower(0);
  };

  const handleBack = () => {
    // Go back to previous state
    if (gameState === 'disclaimer') {
      setGameState('screensaver');
    } else if (gameState === 'payment') {
      setGameState('disclaimer');
    }
  };

  const handleTimeout = () => {
    // Timeout during punch - reset to start
    setGameState('screensaver');
  };

  return (
    <div className="overflow-hidden">
      {gameState === 'screensaver' && (
        <Screensaver onStart={handleStart} />
      )}
      
      {gameState === 'disclaimer' && (
        <Disclaimer 
          onAccept={handleDisclaimerAccept} 
          onBack={handleBack}
        />
      )}
      
      {gameState === 'payment' && (
        <Payment 
          onPaymentComplete={handlePaymentComplete}
          onBack={handleBack}
        />
      )}
      
      {gameState === 'awaiting_punch' && (
        <AwaitingPunch 
          onPunchDetected={handlePunchDetected}
          onTimeout={handleTimeout}
        />
      )}
      
      {gameState === 'results' && (
        <Results 
          power={punchPower}
          onRestart={handleRestart}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default Index;
