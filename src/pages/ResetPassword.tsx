import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import PSBackground from "@/components/PSBackground";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
});

const ResetPassword = () => {
    const navigate = useNavigate();
    const { updatePassword } = useAuth();
    const { t } = useLanguage();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Parse hash fragment - handles both #access_token=... and #/reset-password?access_token=... usage
        const hash = window.location.hash;

        // Supabase puts tokens in the hash like #access_token=...&type=recovery
        // But if routing is hash-based or mixed, it might be tricky.
        // We look for the params wherever they are.

        let params = new URLSearchParams(hash.substring(1)); // Remove leading #

        // Sometimes the hash starts with a path like #/reset-password?access_token=...
        if (hash.includes('?')) {
            const split = hash.split('?');
            if (split.length > 1) {
                params = new URLSearchParams(split[1]);
            }
        }

        const accessToken = params.get('access_token');
        const type = params.get('type');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
            toast.error(errorDescription?.replace(/\+/g, " ") || error);
            setTimeout(() => navigate('/staff-login'), 4000);
            return;
        }

        const setupSession = async () => {
            if (accessToken && type === 'recovery') {
                // Explicitly set the session to ensure we are authenticated
                // We try to get the refresh_token if available (implicit flow usually just has access_token)
                const refreshToken = params.get('refresh_token');

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || "",
                });

                if (sessionError) {
                    console.error("Failed to set session", sessionError);
                    toast.error(t("auth.sessionExpired"));
                    setTimeout(() => navigate('/staff-login'), 4000);
                } else {
                    // Session established successfully
                }
            } else {
                // No recovery token found
                toast.error(t("auth.invalidResetLink"));
                setTimeout(() => navigate('/staff-login'), 4000);
            }
        };

        setupSession();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords
        const validation = passwordSchema.safeParse({
            password: newPassword,
            confirmPassword: confirmPassword,
        });

        if (!validation.success) {
            setError(validation.error.errors[0].message);
            return;
        }

        setIsLoading(true);

        try {
            const { error: updateError } = await updatePassword(newPassword);

            if (updateError) {
                setError(updateError.message);
                toast.error(updateError.message);
                return;
            }

            setSuccess(true);
            toast.success(t("auth.passwordUpdated"));

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/staff-login');
            }, 3000);
        } catch (err) {
            setError(t("auth.unexpectedError"));
            toast.error(t("auth.unexpectedError"));
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
                <PSBackground />

                <div className="relative z-10 w-full max-w-md">
                    <div className="glass-card rounded-2xl p-8 text-center neon-border">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>

                        <h1 className="font-display text-2xl font-bold mb-4">
                            {t("auth.passwordUpdated")}
                        </h1>

                        <p className="text-muted-foreground mb-6">
                            {t("auth.canNowSignIn")}
                        </p>

                        <Button
                            variant="hero"
                            onClick={() => navigate('/staff-login')}
                            className="w-full"
                        >
                            {t("auth.backToLogin")}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
            <PSBackground />

            <div className="relative z-10 w-full max-w-md">
                <div className="glass-card rounded-2xl p-6 sm:p-8 neon-border">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 mb-4">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="font-display text-2xl font-bold mb-2">
                            {t("auth.resetPasswordTitle")}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {t("auth.enterNewPassword")}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-6">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {/* Reset Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="ps-10 pe-10"
                                    required
                                    minLength={6}
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

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t("auth.confirmNewPassword")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="ps-10 pe-10"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="hero"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? t("auth.updating") : t("auth.updatePassword")}
                        </Button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/staff-login')}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {t("auth.backToLogin")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
