
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

  const handlePlayAgain = () => {
    setGameState('payment');
  };

  const handleFinish = () => {
    setGameState('screensaver');
  };

  switch (gameState) {
    case 'screensaver':
      return <Screensaver onStart={handleStart} onAdminAccess={handleAdminAccess} />;
    case 'disclaimer':
      return <Disclaimer onAccept={handleAcceptDisclaimer} onBack={handleBackToScreensaver} />;
    case 'payment':
      return <Payment onPaymentComplete={handlePaymentComplete} onBack={handleBackToScreensaver} />;
    case 'awaiting-punch':
      return <AwaitingPunch onPunchDetected={handlePunchDetected} />;
    case 'results':
      return <Results score={punchResult} onPlayAgain={handlePlayAgain} onFinish={handleFinish} />;
    case 'admin-login':
      return <AdminLogin onLogin={handleAdminLogin} onCancel={handleBackToScreensaver} />;
    case 'admin-menu':
      return <AdminMenu onExit={handleAdminExit} />;
    default:
      return <Screensaver onStart={handleStart} onAdminAccess={handleAdminAccess} />;
  }
};

export default PunchMachine;
