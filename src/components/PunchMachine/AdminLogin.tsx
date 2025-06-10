
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onLogin: () => void;
  onCancel: () => void;
}

const AdminLogin = ({ onLogin, onCancel }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  // Simple admin password for demo - in production this would be properly secured
  const ADMIN_PASSWORD = "admin123";
  const MAX_ATTEMPTS = 3;

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin();
      setError("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Too many failed attempts. Access denied.`);
        setTimeout(() => {
          onCancel();
        }, 3000);
      } else {
        setError(`Invalid password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setPassword("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-slate-300 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl text-red-600">
            <Lock className="w-8 h-8" />
            ADMIN ACCESS
          </CardTitle>
          <p className="text-slate-600 text-sm mt-2">
            Enter administrator password to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-900 font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter admin password"
                className="bg-white border-slate-300 text-slate-900 pr-10"
                disabled={attempts >= MAX_ATTEMPTS}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-slate-600 hover:text-slate-900"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={onCancel}
              variant="outline" 
              className="flex-1 text-slate-700 border-slate-400 bg-white hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogin}
              disabled={!password || attempts >= MAX_ATTEMPTS}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Login
            </Button>
          </div>

          <div className="text-center text-xs text-slate-500 mt-4">
            Demo Password: admin123
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
