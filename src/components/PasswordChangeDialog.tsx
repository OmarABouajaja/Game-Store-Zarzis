import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PasswordChangeDialogProps {
    trigger?: React.ReactNode;
}

const PasswordChangeDialog = ({ trigger }: PasswordChangeDialogProps) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError(t("password.length_error"));
            return;
        }

        if (password !== confirmPassword) {
            setError(t("password.match_error"));
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            toast({
                title: t("password.success_title"),
                description: t("password.success_desc"),
            });

            setIsOpen(false);
            setPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error("Error updating password:", err);
            setError(err.message || "Une erreur s'est produite.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                        <Key className="w-4 h-4 me-2" />
                        {t("password.change_title")}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass-panel border-primary/30 max-w-[95vw] sm:max-w-[400px] overflow-hidden p-0 !translate-x-[-50%] !translate-y-[-50%]">
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-primary to-purple-500" />
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Key className="w-5 h-5 text-primary" />
                            </div>
                            {t("password.change_title")}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-sm font-medium text-white/70">{t("password.new_password")}</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="h-10 sm:h-12 text-base relative z-0"
                                style={{
                                    backgroundColor: '#18181b',
                                    borderColor: '#52525b',
                                    color: '#ffffff',
                                    opacity: 1
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-sm font-medium text-white/70">{t("password.confirm_password")}</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="h-10 sm:h-12 text-base relative z-0"
                                style={{
                                    backgroundColor: '#18181b',
                                    borderColor: '#52525b',
                                    color: '#ffffff',
                                    opacity: 1
                                }}
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                disabled={isLoading}
                                className="flex-1 h-12 text-lg font-medium"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                variant="hero"
                                disabled={isLoading}
                                className="flex-1 h-12 text-lg font-bold neon-cyan-glow"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                                        {t("password.updating")}
                                    </>
                                ) : (
                                    t("settings.saveShort")
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PasswordChangeDialog;
