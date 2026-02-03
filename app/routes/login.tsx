import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { ChefHat, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import useStore from "~/store/useStore";
import { toast } from "sonner";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useStore();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Harap isi semua kolom");
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      // Mock authentication - accept any credentials for prototype
      if (username && password) {
        login(username);
        toast.success("Login berhasil!", {
          description: "Selamat datang di Dashboard Ayam Geprek Sriwedari",
        });
        navigate("/");
      } else {
        toast.error("Login gagal", {
          description: "Username atau password salah",
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/239975/pexels-photo-239975.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.3)",
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-0 bg-linear-to-br from-primary/30 via-background/80 to-background" />

      {/* Decorative shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ChefHat className="w-10 h-10 text-primary-foreground" />
            </div>

            <CardTitle className="text-2xl font-heading font-bold text-foreground">
              Ayam Geprek Sriwedari
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Masuk ke Control Panel
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value)
                  }
                  className="h-11 bg-background/50 border-border focus:border-primary transition-colors"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    className="h-11 bg-background/50 border-border focus:border-primary transition-colors pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-center text-muted-foreground">
                <span className="font-medium text-foreground">Demo:</span>{" "}
                Gunakan username dan password apapun untuk masuk
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; 2024 Ayam Geprek Sriwedari. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
