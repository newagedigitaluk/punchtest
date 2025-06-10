
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DisclaimerProps {
  onAccept: () => void;
  onBack: () => void;
}

const Disclaimer = ({ onAccept, onBack }: DisclaimerProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white p-8">
      <div className="max-w-4xl text-center animate-fade-in">
        <h1 className="text-6xl font-bold mb-8 text-red-400">
          ⚠️ DISCLAIMER ⚠️
        </h1>
        
        <div className="bg-black/50 rounded-lg p-8 mb-8 text-left">
          <h2 className="text-2xl font-semibold mb-6 text-center text-yellow-400">
            IMPORTANT - PLEASE READ CAREFULLY
          </h2>
          
          <div className="space-y-4 text-lg">
            <p>
              • You participate in this punch machine activity at your own risk
            </p>
            <p>
              • We accept no liability for any injuries that may occur during use
            </p>
            <p>
              • Users must be 18+ or have parental supervision
            </p>
            <p>
              • Do not use if you have any medical conditions affecting your arms, hands, or heart
            </p>
            <p>
              • Use proper punching technique - punch straight, not at angles
            </p>
            <p>
              • Maximum one punch per payment
            </p>
            <p>
              • Management reserves the right to refuse service
            </p>
          </div>
        </div>

        <div className="mb-8">
          <label className="flex items-center justify-center text-xl cursor-pointer">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-6 h-6 mr-4 accent-red-500"
            />
            I have read and accept the terms above
          </label>
        </div>

        <div className="flex gap-6 justify-center">
          <Button 
            onClick={onBack}
            variant="outline"
            size="lg"
            className="text-xl px-8 py-4"
          >
            Back
          </Button>
          
          <Button 
            onClick={onAccept}
            disabled={!accepted}
            size="lg"
            className="text-xl px-8 py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50"
          >
            Accept & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
