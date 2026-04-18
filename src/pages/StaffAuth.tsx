import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gamepad2, Lock, Mail, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import PSBackground from "@/components/PSBackground";
import { z } from "zod";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const StaffAuth = () => {
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError(t("auth.invalidEmailPassword"));
        } else {
          setError(signInError.message);
        }
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(t("auth.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailSchema = z.string().email();
    const validation = emailSchema.safeParse(resetEmail);

    if (!validation.success) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    setIsResetLoading(true);

    try {
      const { error: resetError } = await resetPassword(resetEmail);

      if (resetError) {
        if (resetError.message.includes("Email rate limit")) {
          toast.error(t("auth.tooManyRequests"));
        } else {
          toast.error(resetError.message);
        }
        return;
      }

      setResetSuccess(true);
      toast.success(t("auth.resetEmailSent"), {
        description: t("auth.resetEmailSentDesc")
      });
    } catch (err) {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <PSBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-6 sm:p-8 neon-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 mb-4">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">{t("auth.staffLogin")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.dashboardSubtitle")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-6">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@gamestore.tn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-10 pe-10"
                  autoComplete="current-password"
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

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 underline transition-colors"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("auth.backToWebsite")}
            </Button>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          setResetSuccess(false);
          setResetEmail("");
        }
      }}>
        <DialogContent className="glass-panel border-primary/30 max-w-[95vw] sm:max-w-[400px] overflow-hidden p-0 !translate-x-[-50%] !translate-y-[-50%]">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-primary to-purple-500" />
          <div className="p-6">
            {resetSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">{t("auth.resetEmailSent")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.resetEmailSentDesc")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="mt-4"
                >
                  {t("auth.backToLogin")}
                </Button>
              </div>
            ) : (
              <>
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    {t("auth.resetPasswordTitle")}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {t("auth.resetPasswordDesc")}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm font-medium text-white/70">
                      {t("client.email_address")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="staff@gamestore.tn"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="ps-10 h-10 sm:h-12 text-base relative z-0"
                        style={{
                          backgroundColor: '#18181b',
                          borderColor: '#52525b',
                          color: '#ffffff',
                          opacity: 1
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full sm:w-auto sm:flex-1 min-w-0"
                      disabled={isResetLoading}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full sm:w-auto sm:flex-[1.5] min-w-0 h-11 neon-cyan-glow whitespace-normal break-words text-center"
                      disabled={isResetLoading}
                    >
                      {isResetLoading ? t("staff.processing") : t("auth.sendResetLink")}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffAuth;
