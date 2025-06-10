
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ScreensaverProps {
  onStart: () => void;
  onAdminAccess: () => void;
}

const Screensaver = ({ onStart, onAdminAccess }: ScreensaverProps) => {
  const [adminClickCount, setAdminClickCount] = useState(0);

  const handleLogoClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    
    // Reset counter after 3 seconds of inactivity
    setTimeout(() => {
      setAdminClickCount(0);
    }, 3000);

    // 5 clicks in sequence opens admin
    if (newCount >= 5) {
      onAdminAccess();
      setAdminClickCount(0);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="text-center animate-fade-in relative z-10">
        <h1 
          className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 drop-shadow-2xl animate-pulse cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          PUNCH POWER
        </h1>
        <h2 className="text-xl font-bold mb-4 text-gray-100">
          Test Your Ultimate Strength!
        </h2>
        
        <div className="mb-6 relative">
          <div className="text-3xl mb-2 animate-bounce">🥊</div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
          <p className="text-base font-semibold text-gray-200 relative z-10">
            Hit the bag and unleash your power
          </p>
        </div>

        <Button 
          onClick={onStart}
          size="lg"
          className="text-xl px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-yellow-400 hover:border-yellow-300"
        >
          <span className="flex items-center gap-3">
            ⚡ PRESS START ⚡
          </span>
        </Button>

        <div className="mt-4 text-lg font-bold text-yellow-400">
          <p className="animate-pulse">Only £1 per punch</p>
        </div>
        
        {adminClickCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Admin access: {adminClickCount}/5 clicks
          </div>
        )}
      </div>
    </div>
  );
};

export default Screensaver;
