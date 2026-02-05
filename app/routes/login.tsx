import { useState, FormEvent, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { useAuthStore } from "~/modules/auth/auth.store";
import { loginSchema } from "~/modules/auth/auth.schema";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Data login tidak valid";
      toast.error(firstError);
      return;
    }

    setIsLoading(true);

    try {
      await login(parsed.data);
      toast.success("Login berhasil!", {
        description: "Selamat datang di Dashboard Ayam Geprek Sriwedari",
      });
      navigate("/");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Email atau password salah";
      toast.error("Login gagal", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
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
        <Card className="bg-white border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="mx-auto mb-4 relative group">
              <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-24 h-24 rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden shadow-glow">
                <img
                  src="/icons/icon.png"
                  alt="Logo Ayam Geprek Sriwedari"
                  className="w-20 h-20 object-contain transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>

            <CardTitle className="text-2xl font-heading font-bold text-foreground">
              Ayam Geprek Sriwedari
            </CardTitle>
            <CardDescription className="text-foreground/70 font-medium">
              Masuk ke Control Panel
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  className="h-11 bg-white border-border focus:border-primary text-foreground font-medium transition-colors"
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
                    className="h-11 bg-white border-border focus:border-primary text-foreground font-medium transition-colors pr-10"
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

            <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-center text-foreground/70">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/60 font-medium mt-6">
          &copy; {new Date().getFullYear()} Ayam Geprek Sriwedari. All rights
          reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
