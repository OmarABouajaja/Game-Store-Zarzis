import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Smartphone, Mail, Gamepad2, Star, Gift, History, Check, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Client } from '@/types';
import { toast } from '@/hooks/use-toast';
import { isValidEmail, isValidPhone, isValidName } from '@/utils/validation';
import { cn } from "@/lib/utils";
import SEO from '@/components/SEO';

const rawUrl = import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn';
const API_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

const ClientAuth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const { t, language } = useLanguage();

  const { clients, addClient, settings } = useData();
  const navigate = useNavigate();

  const smsEnabled = settings?.auth_config?.enable_sms_verification ?? true;

  const [phone, setPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to persistent login

  // Auto-login check (ensure persistence)
  useEffect(() => {
    // Check both storages
    const savedClient = localStorage.getItem('client_user') || sessionStorage.getItem('client_user');

    if (savedClient) {
      try {
        const parsed = JSON.parse(savedClient);
        if (parsed && parsed.id) {
          // Valid session found, redirect to home
          // Use replace to prevent back-button loops
          navigate('/', { replace: true });
        }
      } catch (e) {
        // Invalid json, clear it
        localStorage.removeItem('client_user');
        sessionStorage.removeItem('client_user');
      }
    }
  }, [navigate]);

  const getIdentifier = () => smsEnabled ? phone : loginEmail;
  const getRegisterIdentifier = () => smsEnabled ? phone : registerData.email;

  const sendOtp = async (identifier: string, type: 'sms' | 'email') => {
    const res = await fetch(`${API_URL}/verify/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, type, lang: language })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to send code');
    }
    return res.json();
  };

  const verifyOtp = async (identifier: string, code: string) => {
    const res = await fetch(`${API_URL}/verify/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.detail || data.message || 'Invalid code');
    return data;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const identifier = getIdentifier();
    const type = smsEnabled ? 'sms' : 'email';

    try {
      if (step === 'phone') {
        if (!identifier) throw new Error(`Please enter your ${smsEnabled ? 'phone number' : 'email'}`);

        if (smsEnabled) {
          if (!isValidPhone(identifier)) {
            throw new Error('Please enter a valid Tunisian phone number (8 digits, e.g., 22 333 444)');
          }
        } else {
          if (!isValidEmail(identifier)) {
            throw new Error('Please enter a valid email address');
          }
        }

        let client = clients.find(c => smsEnabled ? c.phone === identifier : c.email === identifier);

        if (!client) {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq(smsEnabled ? 'phone' : 'email', identifier)
            .maybeSingle();

          if (data && !error) {
            client = data;
          }
        }

        if (!client) {
          throw new Error('Account not found. Please register.');
        }

        await sendOtp(identifier, type);
        setStep('verify');
        toast({ title: "Code Sent", description: `Check your ${smsEnabled ? 'messages' : 'email'}` });
      } else {
        await verifyOtp(identifier, otpCode);

        let client = clients.find(c => smsEnabled ? c.phone === identifier : c.email === identifier);

        if (!client) {
          const { data } = await supabase
            .from('clients')
            .select('*')
            .eq(smsEnabled ? 'phone' : 'email', identifier)
            .maybeSingle();
          client = data;
        }

        if (client) {
          // Clear any existing session first
          localStorage.removeItem('client_user');
          sessionStorage.removeItem('client_user');

          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('client_user', JSON.stringify(client));

          toast({ title: "Welcome Back!", description: "Logged in successfully" });
          navigate('/', { replace: true });
        } else {
          throw new Error('Failed to retrieve account details');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const identifier = getRegisterIdentifier();
    const type = smsEnabled ? 'sms' : 'email';

    try {
      if (step === 'phone') {
        if (!registerData.name || !identifier) {
          throw new Error('Please fill in required fields');
        }

        if (!isValidName(registerData.name)) {
          throw new Error('Please enter a valid name (minimum 2 characters)');
        }

        if (smsEnabled) {
          if (!isValidPhone(identifier)) {
            throw new Error('Invalid phone number format');
          }
          if (registerData.email && !isValidEmail(registerData.email)) {
            throw new Error('Invalid email format');
          }
        } else {
          if (!isValidEmail(identifier)) {
            throw new Error('Invalid email format');
          }
          if (phone && !isValidPhone(phone)) {
            throw new Error('Invalid phone number format');
          }
        }

        const { data: existingClient } = await supabase
          .from('clients')
          .select('email,phone')
          .or(`email.eq."${smsEnabled ? registerData.email : identifier}",phone.eq."${smsEnabled ? identifier : phone}"`)
          .maybeSingle();

        if (existingClient) {
          if (existingClient.email === (smsEnabled ? registerData.email : identifier)) {
            throw new Error('This email is already registered. Please login.');
          }
          if (existingClient.phone === (smsEnabled ? identifier : phone)) {
            throw new Error('This phone number is already registered. Please login or contact staff to link your email.');
          }
        }

        await sendOtp(identifier, type);
        setStep('verify');
        toast({ title: "Code Sent", description: `Check your ${smsEnabled ? 'messages' : 'email'}` });
      } else {
        await verifyOtp(identifier, otpCode);

        const newClientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> = {
          name: registerData.name,
          email: smsEnabled ? registerData.email : identifier,
          phone: smsEnabled ? phone : (phone || ''),
          points: 0,
          total_spent: 0,
          total_games_played: 0
        };

        // Await the creation to ensure we get the real ID and data
        const createdClient = await addClient(newClientData);

        if (createdClient) {
          // Direct Login (Auto-login)
          localStorage.setItem('client_user', JSON.stringify(createdClient));
          toast({ title: "Welcome!", description: "Account created and logged in automatically." });
          navigate('/');
        } else {
          // Fallback if something went wrong but no error thrown
          toast({ title: "Account Created", description: "You can now login." });
          setActiveTab('login');
          setStep('phone');
          setOtpCode('');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setStep('phone');
    setError('');
    setOtpCode('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden">
      <SEO title="Client Portal" description="Manage your loyalty points and bookings." />
      {/* Visual Side (Marketing/Branding) */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary/20 via-background to-accent/20 relative border-e border-white/5 overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-1/4 -end-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -start-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-md w-full relative z-10 space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
              <Star className="w-3 h-3 fill-primary" />
              Game Store Zarzis
            </div>
            <h1 className="text-5xl xl:text-6xl font-display font-bold leading-tight">
              {t("client.join_loyalty")}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("client.loyalty_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border-white/5 hover:border-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold">{t("client.benefit_points")}</h3>
                <p className="text-sm text-muted-foreground">
                  {settings?.loyalty_program?.games_required_for_free
                    ? `Buy ${settings.loyalty_program.games_required_for_free} games, get 1 free`
                    : "Buy 10 games, get 1 free"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border-white/5 hover:border-accent/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <History className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-bold">{t("client.benefit_history")}</h3>
                <p className="text-sm text-muted-foreground">Track your sessions and spending</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border-white/5 hover:border-yellow-500/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <Smartphone className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-display font-bold">{t("client.benefit_booking")}</h3>
                <p className="text-sm text-muted-foreground">Reserve your console via WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Join over 500+ active gamers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Side */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Header / Logo */}
          <div className="flex flex-col items-center gap-4 text-center">
            <Link to="/" className="lg:hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20">
                <img src="/gamestorelogocmp.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
            </Link>

            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold tracking-tight">
                {t("client.portal")}
              </h2>
              <p className="text-muted-foreground">
                {activeTab === 'login' ? t("common.welcome_back") : t("client.create_account")}
              </p>
            </div>
          </div>

          <Card className="glass-card p-1 border-white/10 shadow-2xl relative overflow-hidden">
            {/* Decorative glow */}
            <div className={cn(
              "absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-500",
              activeTab === 'register' ? "via-accent" : "via-primary"
            )} />

            <CardContent className="p-4 sm:p-6">
              {/* Refined Tab Switcher */}
              <div className="relative flex p-1 bg-black/40 rounded-xl mb-8 border border-white/5">
                <div
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-300 ease-out",
                    activeTab === 'login' ? "start-1 bg-primary text-primary-foreground shadow-primary/20" : "start-[calc(50%)] bg-accent text-accent-foreground shadow-accent/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => resetFlow('login')}
                  className={cn(
                    "flex-1 relative z-10 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2",
                    activeTab === 'login' ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg"
                  )}
                >
                  <LogIn className={cn("w-4 h-4 transition-transform duration-300", activeTab === 'login' && "scale-110")} />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => resetFlow('register')}
                  className={cn(
                    "flex-1 relative z-10 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2",
                    activeTab === 'register' ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg"
                  )}
                >
                  <UserPlus className={cn("w-4 h-4 transition-transform duration-300", activeTab === 'register' && "scale-110")} />
                  Register
                </button>
              </div>

              {/* Login Form */}
              <div className={cn("transition-all duration-500 ease-in-out", activeTab === 'login' ? "block animate-in fade-in slide-in-from-left-4" : "hidden")}>
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {step === 'phone' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70">{smsEnabled ? t("client.phone_number") : t("client.email_address")}</Label>
                        <div className="relative group">
                          {smsEnabled ? (
                            <>
                              <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                type="tel"
                                placeholder="29 290 065"
                                className="ps-10 h-12 glass-card border-white/10 focus-visible:ring-primary/50 transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </>
                          ) : (
                            <>
                              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                type="email"
                                placeholder="gamer@email.com"
                                className="ps-10 h-12 glass-card border-white/10 focus-visible:ring-primary/50 transition-all"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember_me"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor="remember_me"
                          className="text-xs text-muted-foreground cursor-pointer select-none hover:text-white transition-colors"
                        >
                          {t("client.stay_logged_in")}
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                      <div className="space-y-2">
                        <Label className="text-xl font-display font-bold">{t("client.verification_code")}</Label>
                        <p className="text-xs text-muted-foreground">Sent to {getIdentifier()}</p>
                      </div>
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-3xl tracking-[0.5em] font-mono h-16 glass-card border-primary/30 focus-visible:ring-primary/50"
                        required
                        autoFocus
                        maxLength={6}
                      />
                      <Button type="button" variant="link" size="sm" onClick={() => setStep('phone')} className="text-primary hover:text-primary/80">
                        {t("client.change_method", { method: smsEnabled ? t("client.phone_number") : t("client.email_address") })}
                      </Button>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 animate-in shake">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-12 text-lg font-bold neon-cyan-glow transition-all active:scale-95 group" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 'phone' ? (
                      <span className="flex items-center gap-2">
                        {t("client.send_code")} <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                    ) : t("client.verify_login"))}
                  </Button>
                </form>
              </div>

              {/* Register Form */}
              <div className={cn("transition-all duration-500 ease-in-out", activeTab === 'register' ? "block animate-in fade-in slide-in-from-right-4" : "hidden")}>
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  {step === 'phone' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70">{t("client.full_name")}</Label>
                        <Input
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          placeholder="Ahmed Ben Ali"
                          className="h-11 glass-card border-white/10 focus-visible:ring-accent/50 transition-all"
                          required
                        />
                      </div>

                      {!smsEnabled ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/70">{t("client.email_address")}</Label>
                            <div className="relative group">
                              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                type="email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                placeholder="ahmed.benali@gmail.com"
                                className="ps-10 h-11 glass-card border-white/10 focus-visible:ring-accent/50 transition-all"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/70">{t("client.phone_number")}</Label>
                            <div className="relative group">
                              <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                type="tel"
                                placeholder="23 290 065"
                                className="ps-10 h-11 glass-card border-white/10 focus-visible:ring-accent/50 font-mono transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/70">{t("client.phone_number")}</Label>
                            <div className="relative group">
                              <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                type="tel"
                                placeholder="23 290 065"
                                className="ps-10 h-11 glass-card border-white/10 focus-visible:ring-accent/50 font-mono transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/70">{t("client.email_address")} ({t("common.optional") || 'Optional'})</Label>
                            <div className="relative group">
                              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                type="email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                placeholder="gamer@email.com"
                                className="ps-10 h-11 glass-card border-white/10 focus-visible:ring-accent/50 transition-all"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                      <div className="space-y-2">
                        <Label className="text-xl font-display font-bold">{t("client.verification_code")}</Label>
                        <p className="text-xs text-muted-foreground">Sent to {getRegisterIdentifier()}</p>
                      </div>
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-3xl tracking-[0.5em] font-mono h-16 glass-card border-accent/30 focus-visible:ring-accent/50"
                        required
                        autoFocus
                        maxLength={6}
                      />
                      <Button type="button" variant="link" size="sm" onClick={() => setStep('phone')} className="text-accent hover:text-accent/80">
                        {t("common.back") || "Back"}
                      </Button>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 animate-in shake">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-12 text-lg font-bold neon-magenta-glow transition-all active:scale-95" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 'phone' ? t("client.send_code") : t("client.verify_register"))}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              {t("client.back_to_shop")}
            </Link>
          </div>
        </div>
      </div>
    </div >
  );
};

export default ClientAuth;
