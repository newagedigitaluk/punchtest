
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DisclaimerProps {
  onAccept: () => void;
  onBack: () => void;
}

const Disclaimer = ({ onAccept, onBack }: DisclaimerProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-4xl text-center animate-fade-in relative z-10">
        <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
          ⚠️ DISCLAIMER ⚠️
        </h1>
        
        <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 mb-6 text-left border border-gray-700 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-center text-yellow-400">
            IMPORTANT - PLEASE READ CAREFULLY
          </h2>
          
          <div className="space-y-2 text-lg leading-relaxed">
            <p className="flex items-center gap-3">
              <span className="text-red-400">•</span> You participate at your own risk
            </p>
            <p className="flex items-center gap-3">
              <span className="text-red-400">•</span> No liability for injuries
            </p>
            <p className="flex items-center gap-3">
              <span className="text-red-400">•</span> Must be 18+ or have supervision
            </p>
            <p className="flex items-center gap-3">
              <span className="text-red-400">•</span> No medical conditions affecting arms/heart
            </p>
            <p className="flex items-center gap-3">
              <span className="text-red-400">•</span> Use proper technique - punch straight
            </p>
            <p className="flex items-center gap-3">
              <span className="text-red-400">•</span> One punch per payment
            </p>
          </div>
        </div>

        <div className="mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600">
          <label className="flex items-center justify-center text-2xl cursor-pointer group">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-6 h-6 mr-4 accent-red-500 cursor-pointer"
            />
            <span className="group-hover:text-yellow-400 transition-colors duration-200">
              I accept the terms above
            </span>
          </label>
        </div>

        <div className="flex gap-6 justify-center">
          <Button 
            onClick={onBack}
            variant="outline"
            size="lg"
            className="text-2xl px-12 py-6 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
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
