
import { Button } from "@/components/ui/button";

interface ScreensaverProps {
  onStart: () => void;
}

const Screensaver = ({ onStart }: ScreensaverProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center text-white p-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold mb-8 text-yellow-400 drop-shadow-lg">
          PUNCH POWER
        </h1>
        <h2 className="text-4xl font-semibold mb-12">
          Test Your Strength!
        </h2>
        
        <div className="mb-16">
          <div className="text-6xl mb-4">🥊</div>
          <p className="text-2xl opacity-90">
            Hit the bag and see your power rating
          </p>
        </div>

        <Button 
          onClick={onStart}
          size="lg"
          className="text-3xl px-16 py-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
        >
          PRESS START
        </Button>

        <div className="mt-12 text-lg opacity-75">
          <p>Only £1 per punch</p>
        </div>
      </div>
    </div>
  );
};

export default Screensaver;
