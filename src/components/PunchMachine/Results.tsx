
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
    if (power < 100) return { rating: "Warm Up", color: "text-blue-400", emoji: "😴" };
    if (power < 200) return { rating: "Getting Started", color: "text-green-400", emoji: "👍" };
    if (power < 300) return { rating: "Not Bad!", color: "text-yellow-400", emoji: "💪" };
    if (power < 400) return { rating: "Strong!", color: "text-orange-400", emoji: "🔥" };
    if (power < 500) return { rating: "Powerful!", color: "text-red-400", emoji: "💥" };
    if (power < 600) return { rating: "Beast Mode!", color: "text-purple-400", emoji: "🦍" };
    if (power < 700) return { rating: "Incredible!", color: "text-pink-400", emoji: "⚡" };
    if (power < 800) return { rating: "Superhuman!", color: "text-cyan-400", emoji: "🚀" };
    if (power < 900) return { rating: "LEGENDARY!", color: "text-yellow-300", emoji: "👑" };
    return { rating: "GODLIKE!", color: "text-gold", emoji: "🏆" };
  };

  const { rating, color, emoji } = getPowerRating(power);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex flex-col items-center justify-center text-white p-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-bold mb-8 text-yellow-400">
          YOUR RESULTS
        </h1>
        
        <div className="bg-black/50 rounded-lg p-8 mb-8">
          <div className="text-8xl mb-6">{emoji}</div>
          
          <div className="mb-6">
            <div className="text-8xl font-bold text-yellow-300 mb-4">
              {power}
            </div>
            <div className="text-3xl font-semibold text-gray-300">
              KILOGRAMS
            </div>
          </div>
          
          <div className={`text-4xl font-bold mb-6 ${color}`}>
            {rating}
          </div>
          
          <div className="text-xl opacity-75">
            Great punch! Thanks for playing!
          </div>
        </div>

        <div className="mb-8">
          <p className="text-lg opacity-75">
            Auto-restart in: <span className="font-bold text-yellow-400">{countdown}s</span>
          </p>
        </div>

        <div className="flex gap-6 justify-center">
          <Button 
            onClick={onReset}
            variant="outline"
            size="lg"
            className="text-xl px-8 py-4"
          >
            Start Over
          </Button>
          
          <Button 
            onClick={onRestart}
            size="lg"
            className="text-xl px-8 py-4 bg-green-600 hover:bg-green-500"
          >
            Play Again (£2)
          </Button>
        </div>

        <div className="mt-8 text-sm opacity-60">
          <p>Share your score with friends!</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
