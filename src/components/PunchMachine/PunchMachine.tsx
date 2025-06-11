
import { useState } from 'react';
import Screensaver from './Screensaver';
import Disclaimer from './Disclaimer';
import Payment from './Payment';
import AwaitingPunch from './AwaitingPunch';
import Results from './Results';
import AdminLogin from './AdminLogin';
import AdminMenu from './AdminMenu';

type GameState = 'screensaver' | 'disclaimer' | 'payment' | 'awaiting-punch' | 'results' | 'admin-login' | 'admin-menu';

const PunchMachine = () => {
  const [gameState, setGameState] = useState<GameState>('screensaver');
  const [punchResult, setPunchResult] = useState<number>(0);

  const handleAdminAccess = () => {
    setGameState('admin-login');
  };

  const handleAdminLogin = () => {
    setGameState('admin-menu');
  };

  const handleAdminExit = () => {
    setGameState('screensaver');
  };

  const handleStart = () => {
    setGameState('disclaimer');
  };

  const handleAcceptDisclaimer = () => {
    setGameState('payment');
  };

  const handleBackToScreensaver = () => {
    setGameState('screensaver');
  };

  const handlePaymentComplete = () => {
    setGameState('awaiting-punch');
  };

  const handlePunchDetected = (force: number) => {
    setPunchResult(force);
    setGameState('results');
  };

  const handleTimeout = () => {
    setGameState('screensaver');
  };

  const handlePlayAgain = () => {
    setGameState('payment');
  };

  const handleFinish = () => {
    setGameState('screensaver');
  };

  return (
    <div className="w-screen h-screen overflow-hidden landscape-mode">
      {gameState === 'screensaver' && (
        <Screensaver onStart={handleStart} onAdminAccess={handleAdminAccess} />
      )}
      {gameState === 'disclaimer' && (
        <Disclaimer onAccept={handleAcceptDisclaimer} onBack={handleBackToScreensaver} />
      )}
      {gameState === 'payment' && (
        <Payment onPaymentComplete={handlePaymentComplete} onBack={handleBackToScreensaver} />
      )}
      {gameState === 'awaiting-punch' && (
        <AwaitingPunch onPunchDetected={handlePunchDetected} onTimeout={handleTimeout} />
      )}
      {gameState === 'results' && (
        <Results power={punchResult} onRestart={handlePlayAgain} onReset={handleFinish} />
      )}
      {gameState === 'admin-login' && (
        <AdminLogin onLogin={handleAdminLogin} onCancel={handleBackToScreensaver} />
      )}
      {gameState === 'admin-menu' && (
        <AdminMenu onExit={handleAdminExit} />
      )}
    </div>
  );
};

export default PunchMachine;
