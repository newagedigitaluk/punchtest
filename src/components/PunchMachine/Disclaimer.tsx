
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DisclaimerProps {
  onAccept: () => void;
  onBack: () => void;
}

const Disclaimer = ({ onAccept, onBack }: DisclaimerProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-4xl text-center animate-fade-in relative z-10">
        <h1 className="text-7xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
          ⚠️ DISCLAIMER ⚠️
        </h1>
        
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 mb-8 text-left border border-gray-700 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">
            IMPORTANT - PLEASE READ CAREFULLY
          </h2>
          
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> You participate in this punch machine activity at your own risk
            </p>
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> We accept no liability for any injuries that may occur during use
            </p>
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> Users must be 18+ or have parental supervision
            </p>
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> Do not use if you have any medical conditions affecting your arms, hands, or heart
            </p>
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> Use proper punching technique - punch straight, not at angles
            </p>
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> Maximum one punch per payment
            </p>
            <p className="flex items-center gap-4">
              <span className="text-red-400">•</span> Management reserves the right to refuse service
            </p>
          </div>
        </div>

        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600">
          <label className="flex items-center justify-center text-2xl cursor-pointer group">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-16 h-16 mr-8 accent-red-500 cursor-pointer scale-125"
            />
            <span className="group-hover:text-yellow-400 transition-colors duration-200">
              I have read and accept the terms above
            </span>
          </label>
        </div>

        <div className="flex gap-8 justify-center">
          <Button 
            onClick={onBack}
            variant="outline"
            size="lg"
            className="text-2xl px-12 py-6 bg-gray-800/50 text-gray-200 border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
          >
            ← Back
          </Button>
          
          <Button 
            onClick={onAccept}
            disabled={!accepted}
            size="lg"
            className="text-2xl px-12 py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Accept & Continue →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
