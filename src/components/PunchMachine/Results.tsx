
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ResultsProps {
  power: number;
  onRestart: () => void;
  onReset: () => void;
}

const Results = ({ power, onRestart, onReset }: ResultsProps) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      } else {
        onReset();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onReset]);

  const getPowerRating = (power: number) => {
    if (power < 100) return { rating: "Warm Up", color: "text-blue-400", emoji: "😴", bgColor: "from-blue-600 to-blue-800" };
    if (power < 200) return { rating: "Getting Started", color: "text-green-400", emoji: "👍", bgColor: "from-green-600 to-green-800" };
    if (power < 300) return { rating: "Not Bad!", color: "text-yellow-400", emoji: "💪", bgColor: "from-yellow-600 to-yellow-800" };
    if (power < 400) return { rating: "Strong!", color: "text-orange-400", emoji: "🔥", bgColor: "from-orange-600 to-orange-800" };
    if (power < 500) return { rating: "Powerful!", color: "text-red-400", emoji: "💥", bgColor: "from-red-600 to-red-800" };
    if (power < 600) return { rating: "Beast Mode!", color: "text-purple-400", emoji: "🦍", bgColor: "from-purple-600 to-purple-800" };
    if (power < 700) return { rating: "Incredible!", color: "text-pink-400", emoji: "⚡", bgColor: "from-pink-600 to-pink-800" };
    if (power < 800) return { rating: "Superhuman!", color: "text-cyan-400", emoji: "🚀", bgColor: "from-cyan-600 to-cyan-800" };
    if (power < 900) return { rating: "LEGENDARY!", color: "text-yellow-300", emoji: "👑", bgColor: "from-yellow-500 to-orange-600" };
    return { rating: "GODLIKE!", color: "text-yellow-200", emoji: "🏆", bgColor: "from-yellow-400 to-red-600" };
  };

  const { rating, color, emoji, bgColor } = getPowerRating(power);

  return (
    <div className={`h-screen bg-gradient-to-br ${bgColor} flex flex-col items-center justify-center text-white p-4 relative overflow-hidden`}>
      {/* Celebratory background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-5 left-5 w-20 h-20 bg-yellow-400/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-10 right-10 w-16 h-16 bg-red-400/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-5 right-5 w-18 h-18 bg-green-400/30 rounded-full blur-2xl animate-pulse"></div>
      </div>
      
      <div className="text-center animate-fade-in relative z-10">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-white">
          🏆 YOUR RESULTS
        </h1>
        
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 mb-4 border-4 border-yellow-400/50 shadow-2xl">
          <div className="text-5xl mb-4 animate-bounce">{emoji}</div>
          
          <div className="mb-4">
            <div className="text-5xl font-bold text-yellow-300 mb-3 animate-pulse">
              {power}
            </div>
            <div className="text-xl font-bold text-gray-200">
              KILOGRAMS
            </div>
          </div>
          
          <div className={`text-2xl font-bold mb-4 ${color} animate-pulse`}>
            {rating}
          </div>
          
          <div className="text-lg opacity-90 text-gray-200">
            Amazing punch! Thanks for playing!
          </div>
        </div>

        <div className="mb-4 bg-gray-900/50 rounded-xl p-2">
          <p className="text-lg opacity-90">
            Auto-restart in: <span className="font-bold text-yellow-400 text-xl">{countdown}s</span>
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={onReset}
            variant="outline"
            size="lg"
            className="text-lg px-8 py-4 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
          >
            🏠 Start Over
          </Button>
          
          <Button 
            onClick={onRestart}
            size="lg"
            className="text-lg px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🔄 Play Again (£1)
          </Button>
        </div>

        <div className="mt-4 text-sm opacity-70 bg-gray-800/30 rounded-lg p-2">
          <p>📱 Share your score with friends!</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
