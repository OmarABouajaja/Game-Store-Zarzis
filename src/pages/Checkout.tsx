import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Truck, MapPin, CreditCard, ArrowRight, ArrowLeft, Trash2, Plus, Minus, User, Phone, Mail, AlertCircle, Info, Banknote, CheckCircle2, ShoppingBag } from "lucide-react";
import { isValidEmail, isValidPhone, isValidName } from '@/utils/validation';
import SEO from '@/components/SEO';
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

const Checkout = () => {
    const navigate = useNavigate();
    const { t, language, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const { items, updateQuantity, removeItem, clearCart, cartTotal } = useCart();
    const { user } = useAuth();
    const { clients } = useData();
    const { data: storeSettings } = useStoreSettings();
    const createOrder = useCreateOrder();

    // Check for client in localStorage (from ClientAuth) or Supabase Auth
    const [storedClient, setStoredClient] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('client_user');
        if (stored) {
            try {
                setStoredClient(JSON.parse(stored));
            } catch (e) {
                console.error("Invalid client data", e);
            }
        }
    }, []);

    const activeClient = storedClient || clients.find(c => c.phone === user?.email || c.name === user?.email?.split('@')[0]);

    // Form State
    const [step, setStep] = useState<'cart' | 'details' | 'review'>('cart');
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: user?.email || "",
        deliveryMethod: 'pickup' as 'pickup' | 'rapid_post' | 'local_delivery',
        address: "",
        paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'd17' | 'card',
        paymentReference: "",
        notes: ""
    });

    // Auto-fill when client data loads
    useEffect(() => {
        if (activeClient && !formData.name) {
            setFormData(prev => ({
                ...prev,
                name: activeClient.name || "",
                phone: activeClient.phone || "",
                email: activeClient.email || prev.email
            }));
        }
    }, [activeClient]);

    const isCartEmpty = items.length === 0;
    const isDigitalOnly = items.length > 0 && items.every(item => item.product_type === 'digital');
    const hasDigitalItems = items.some(item => item.product_type === 'digital');

    // Effect to adjust delivery for digital-only - optimized to avoid loops
    useEffect(() => {
        if (isDigitalOnly && formData.deliveryMethod !== 'pickup') {
            setFormData(prev => ({ ...prev, deliveryMethod: 'pickup' }));
        }
    }, [isDigitalOnly, formData.deliveryMethod]);

    // Delivery Costs (Fetch from settings or hardcode fallback)
    const rapidPostCost = storeSettings?.delivery_settings?.rapid_post_cost ?? 8.000;
    const localDeliveryCost = storeSettings?.delivery_settings?.local_delivery_cost ?? 7.000;

    // Calculate totals
    const deliveryCost = formData.deliveryMethod === 'rapid_post' ? rapidPostCost
        : formData.deliveryMethod === 'local_delivery' ? localDeliveryCost
            : 0;
    const total = cartTotal + deliveryCost;

    const handleNext = () => {
        if (step === 'cart') setStep('details');
        else if (step === 'details') {
            if (!formData.name || !formData.phone) {
                toast({ title: t('checkout.error.missing'), description: t('checkout.error.missing_desc'), variant: "destructive" });
                return;
            }
            if (!isValidName(formData.name)) {
                toast({ title: t('checkout.error.name'), description: t('checkout.error.name_desc'), variant: "destructive" });
                return;
            }
            if (!isValidPhone(formData.phone)) {
                toast({ title: t('checkout.error.phone'), description: t('checkout.error.phone_desc'), variant: "destructive" });
                return;
            }
            if ((formData.email || hasDigitalItems) && !isValidEmail(formData.email)) {
                toast({ title: t('checkout.error.email'), description: hasDigitalItems ? t('checkout.error.email_desc') : t('contact.form.email.placeholder'), variant: "destructive" });
                return;
            }
            if (!isDigitalOnly && formData.deliveryMethod !== 'pickup' && !formData.address) {
                toast({ title: t('checkout.error.address'), description: t('checkout.error.address_desc'), variant: "destructive" });
                return;
            }
            setStep('review');
        } else if (step === 'review') {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        // Final stock check before submission
        const outOfStockItems = items.filter(item => {
            const stockLimit = item.stock_quantity ?? item.stock ?? 0;
            return item.quantity > stockLimit;
        });

        if (outOfStockItems.length > 0) {
            toast({ 
                title: "Stock Issue", 
                description: `Cannot checkout: ${outOfStockItems[0].name} exceeds available stock. Please reduce the quantity.`, 
                variant: "destructive" 
            });
            return;
        }

        try {
            await createOrder.mutateAsync({
                client_name: formData.name,
                client_phone: formData.phone,
                client_email: formData.email,
                subtotal: cartTotal,
                delivery_cost: deliveryCost,
                total_amount: total,
                items: items.map(item => ({
                    product_id: item.id,
                    name: item.name,
                    price: item.salePrice || item.price,
                    quantity: item.quantity,
                    product_type: item.product_type,
                    digital_content: item.digital_content
                })),
                delivery_method: formData.deliveryMethod,
                delivery_address: formData.address,
                payment_method: formData.paymentMethod,
                payment_reference: formData.paymentReference,
                notes: formData.notes
            });

            setIsSuccess(true);
            clearCart();

            // Celebration effect
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00f2fe', '#4facfe', '#7000ff']
            });

            // Give time for the celebration animation
            setTimeout(() => {
                navigate('/');
            }, 6000);
        } catch (error: any) {
            toast({ title: t('checkout.error.failed'), description: error.message || "Something went wrong.", variant: "destructive" });
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="text-center z-10"
                >
                    <div className="relative inline-block mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/50"
                        >
                            <CheckCircle2 className="w-16 h-16 text-primary" />
                        </motion.div>
                        {/* Orbiting particles */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-3 h-3 bg-accent rounded-full"
                                animate={{
                                    x: [Math.cos(i * 60) * 80, Math.cos(i * 60 + 360) * 80],
                                    y: [Math.sin(i * 60) * 80, Math.sin(i * 60 + 360) * 80],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "linear"
                                }}
                            />
                        ))}
                    </div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-5xl font-display font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
                    >
                        {t('checkout.success.title')}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-xl text-muted-foreground mb-8 max-w-md mx-auto"
                    >
                        {t('checkout.success.subtitle')}
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <Link to="/">
                            <Button size="lg" className="rounded-full px-12 h-14 text-lg shadow-xl shadow-primary/20 group">
                                {t('checkout.success.home')}
                                <ArrowRight className="ms-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>

                    <p className="mt-12 text-sm text-muted-foreground italic animate-pulse">
                        {t('checkout.redirecting')}
                    </p>
                </motion.div>
            </div>
        );
    }

    if (isCartEmpty && step === 'cart') {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-2">{t('checkout.cart.empty')}</h1>
                <p className="text-muted-foreground mb-8">{t('checkout.cart.empty_desc')}</p>
                <Link to="/">
                    <Button size="lg" className="rounded-full px-8">{t('checkout.cart.browse')}</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-24 bg-background selection:bg-primary/30">
            <SEO
                title="Paiement - Game Store Zarzis"
                description="Finalisez votre commande de jeux, consoles ou services de réparation en toute sécurité."
            />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Custom Step Indicator */}
                <div className="mb-12 relative">
                    <div className="flex justify-between items-center max-w-xl mx-auto relative z-10">
                        {[
                            { id: 'cart', label: t('checkout.cart'), icon: ShoppingBag },
                            { id: 'details', label: t('checkout.delivery'), icon: Truck },
                            { id: 'review', label: t('checkout.review'), icon: CheckCircle2 }
                        ].map((s, idx) => {
                            const isPast = (step === 'details' && s.id === 'cart') || (step === 'review' && (s.id === 'cart' || s.id === 'details'));
                            const isActive = step === s.id;
                            const Icon = s.icon;

                            return (
                                <div key={s.id} className="flex flex-col items-center relative gap-3">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            backgroundColor: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--primary)/0.2)" : "hsl(var(--muted)/0.3)",
                                            scale: isActive ? 1.2 : 1,
                                            boxShadow: isActive ? "0 0 20px hsla(var(--primary), 0.5)" : "none"
                                        }}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isActive ? 'border-primary' : 'border-border/50'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : isPast ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </motion.div>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Connecting line */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md h-[1px] bg-border/30 -z-0">
                        <motion.div
                            initial={false}
                            animate={{
                                width: step === 'cart' ? '0%' : step === 'details' ? '50%' : '100%'
                            }}
                            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                        />
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 items-start">
                    {/* Left Column: Form Steps */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: CART REVIEW */}
                            {step === 'cart' && (
                                <motion.div
                                    key="cart"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                                            <ShoppingBag className="w-6 h-6 text-primary" />
                                            {t('checkout.cart')}
                                        </h2>
                                        <Badge variant="outline" className="rounded-full border-primary/30 text-primary px-4 py-1">
                                            {items.length} {items.length === 1 ? t('client.label.items').slice(0, -1) : t('client.label.items')}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        {items.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="group relative"
                                            >
                                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                                <Card className="glass-card relative border-border/50 overflow-hidden">
                                                    <CardContent className="p-4 flex gap-6">
                                                        <div className="w-24 h-24 bg-muted/30 rounded-xl overflow-hidden shrink-0 border border-border/20 group-hover:border-primary/50 transition-colors">
                                                            {item.image_url ? (
                                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                                    <ShoppingCart className="text-primary/30 w-10 h-10" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between py-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{item.name}</h3>
                                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter opacity-70">{item.category}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold font-mono text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                                                        {(item.salePrice || item.price).toFixed(3)} {t('services.currency')}
                                                                    </p>
                                                                    {item.quantity > 1 && (
                                                                        <p className="text-[10px] text-muted-foreground italic">
                                                                            {(item.salePrice || item.price).toFixed(3)} {t('services.currency')} {t('checkout.cart.each')}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-4">
                                                                <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-full border border-border/30">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 rounded-full hover:bg-primary/20 hover:text-primary"
                                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                        aria-label="Decrease quantity"
                                                                    >
                                                                        <Minus className="w-3 h-3" />
                                                                    </Button>
                                                                    <span className="w-8 text-center font-mono font-bold text-sm">{item.quantity}</span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 rounded-full hover:bg-primary/20 hover:text-primary"
                                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                        aria-label="Increase quantity"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                                    onClick={() => removeItem(item.id)}
                                                                    aria-label="Remove item"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: DELIVERY & CONTACT */}
                            {step === 'details' && (
                                <motion.div
                                    key="details"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-6">
                                        <Card className="glass-card overflow-hidden border-border/50">
                                            <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <User className="w-5 h-5 text-primary" />
                                                    </div>
                                                    {t('checkout.details.contact')}
                                                </CardTitle>
                                                <CardDescription>{t('contact.subtitle')}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('contact.form.name')}</Label>
                                                    <div className="relative group">
                                                        <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors`} />
                                                        <Input
                                                            className={`${isRTL ? 'pe-10' : 'ps-10'} h-12 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl`}
                                                            placeholder={t('checkout.placeholder.name')}
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('contact.phone')}</Label>
                                                    <div className="relative group">
                                                        <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors`} />
                                                        <Input
                                                            type="tel"
                                                            className={`${isRTL ? 'pe-10' : 'ps-10'} h-12 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl`}
                                                            placeholder={t('checkout.placeholder.phone')}
                                                            value={formData.phone}
                                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                                                        {t('contact.form.email')}
                                                        {hasDigitalItems && <span className="text-primary animate-pulse italic capitalize">{t('client.dashboard.redeem_error').split('!')[1].trim()}</span>}
                                                    </Label>
                                                    <div className="relative group">
                                                        <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors`} />
                                                        <Input
                                                            className={`${isRTL ? 'pe-10' : 'ps-10'} h-12 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl ${hasDigitalItems && !formData.email ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
                                                            placeholder={t('checkout.placeholder.email')}
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            required={hasDigitalItems}
                                                        />
                                                    </div>
                                                    {hasDigitalItems && (
                                                        <p className="text-[10px] text-primary/70 flex items-center gap-1 mt-1">
                                                            <Info className="w-3 h-3" /> {t('checkout.info.digital')}
                                                        </p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="glass-card overflow-hidden border-border/50">
                                            <div className="h-1 bg-gradient-to-r from-accent to-primary" />
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Truck className="w-5 h-5 text-primary" />
                                                    </div>
                                                    {t('checkout.details.delivery')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <RadioGroup
                                                    value={formData.deliveryMethod}
                                                    onValueChange={(v: any) => setFormData({ ...formData, deliveryMethod: v })}
                                                    className="grid gap-4"
                                                >
                                                    <Label
                                                        htmlFor="pickup"
                                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.deliveryMethod === 'pickup' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/30 hover:border-primary/30 hover:bg-muted/30'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2 rounded-full ${formData.deliveryMethod === 'pickup' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                <MapPin className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <span className="font-black block uppercase tracking-tight">{t('checkout.delivery.pickup')}</span>
                                                                <span className="text-xs text-muted-foreground">{t('checkout.delivery.pickup_desc')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-primary uppercase">{t('checkout.delivery.free')}</span>
                                                            <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                                                        </div>
                                                    </Label>

                                                    {storeSettings?.delivery_settings?.local_delivery_enabled !== false && (
                                                        <Label
                                                            htmlFor="local"
                                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.deliveryMethod === 'local_delivery' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/30 hover:border-primary/30 hover:bg-muted/30'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-2 rounded-full ${formData.deliveryMethod === 'local_delivery' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                    <Truck className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <span className="font-black block uppercase tracking-tight">{t('checkout.delivery.local')}</span>
                                                                    <span className="text-xs text-muted-foreground">{t('checkout.delivery.local_desc')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-black font-mono">{localDeliveryCost.toFixed(3)} {t('services.currency')}</span>
                                                                <RadioGroupItem value="local_delivery" id="local" className="sr-only" />
                                                            </div>
                                                        </Label>
                                                    )}

                                                    {storeSettings?.delivery_settings?.rapid_post_enabled !== false && !isDigitalOnly && (
                                                        <Label
                                                            htmlFor="post"
                                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.deliveryMethod === 'rapid_post' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/30 hover:border-primary/30 hover:bg-muted/30'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-2 rounded-full ${formData.deliveryMethod === 'rapid_post' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                    <ShoppingBag className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <span className="font-black block uppercase tracking-tight">{t('checkout.delivery.post')}</span>
                                                                    <span className="text-xs text-muted-foreground">{t('checkout.delivery.post_desc')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-black font-mono">{rapidPostCost.toFixed(3)} {t('services.currency')}</span>
                                                                <RadioGroupItem value="rapid_post" id="post" className="sr-only" />
                                                            </div>
                                                        </Label>
                                                    )}
                                                </RadioGroup>

                                                {formData.deliveryMethod !== 'pickup' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        className="space-y-4 pt-6 border-t mt-6 overflow-hidden"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('checkout.details.address')}</Label>
                                                            <div className="relative group">
                                                                <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors`} />
                                                                <textarea
                                                                    rows={3}
                                                                    className={`w-full flex min-h-[80px] rounded-xl border border-border/50 bg-muted/20 px-3 py-2 ${isRTL ? 'pe-10' : 'ps-10'} text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all`}
                                                                    placeholder={t('checkout.details.address_placeholder')}
                                                                    value={formData.address}
                                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: PAYMENT & REVIEW */}
                            {step === 'review' && (
                                <motion.div
                                    key="review"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-6">
                                        <Card className="glass-card overflow-hidden border-border/50 shadow-2xl">
                                            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <CreditCard className="w-5 h-5 text-primary" />
                                                    </div>
                                                    {t('checkout.review.payment')}
                                                </CardTitle>
                                                <CardDescription>{t('sales.payment')}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <RadioGroup
                                                    value={formData.paymentMethod}
                                                    onValueChange={(v: any) => setFormData({ ...formData, paymentMethod: v })}
                                                    className="grid md:grid-cols-2 gap-4"
                                                >
                                                    {[
                                                        { id: 'cash', label: formData.deliveryMethod === 'pickup' ? t('checkout.payment.store') : t('checkout.payment.cash'), desc: t('checkout.payment.cash_desc'), icon: Banknote, enabled: true },
                                                        { id: 'd17', label: t('checkout.payment.d17'), desc: t('checkout.payment.d17_desc'), icon: Phone, enabled: storeSettings?.payment_methods_config?.d17?.enabled },
                                                        { id: 'bank_transfer', label: t('checkout.payment.bank'), desc: t('checkout.payment.bank_desc'), icon: CreditCard, enabled: storeSettings?.payment_methods_config?.bank_transfer?.enabled },
                                                        { id: 'card', label: t('checkout.payment.card'), desc: t('checkout.payment.card_desc'), icon: ArrowRight, enabled: storeSettings?.payment_methods_config?.direct_card?.enabled, comingSoon: !storeSettings?.payment_methods_config?.direct_card?.enabled }
                                                    ].filter(m => m.enabled || m.comingSoon).map((m) => (
                                                        <Label
                                                            key={m.id}
                                                            htmlFor={m.id}
                                                            className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-300 ${m.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${formData.paymentMethod === m.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/30 hover:border-primary/30 hover:bg-muted/30'}`}
                                                        >
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className={`p-2 rounded-lg ${formData.paymentMethod === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                    <m.icon className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-bold text-sm uppercase tracking-tight">{m.label}</span>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground font-medium">{m.desc}</span>
                                                            {!m.comingSoon && <RadioGroupItem value={m.id} id={m.id} className="sr-only" />}
                                                            {m.comingSoon && <Badge className="absolute top-2 right-2 scale-75 uppercase">{t('checkout.payment.soon')}</Badge>}
                                                        </Label>
                                                    ))}
                                                </RadioGroup>

                                                {/* Payment Instructions Details */}
                                                <AnimatePresence>
                                                    {formData.paymentMethod !== 'cash' && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="mt-8 overflow-hidden space-y-6"
                                                        >
                                                            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                                                                <div className="flex items-center gap-2 group">
                                                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                                                                        <Info className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                    <h4 className="font-bold text-sm uppercase tracking-wider">{t('checkout.review.instructions')}</h4>
                                                                </div>
                                                                <div className="p-4 bg-background/50 rounded-xl border border-primary/10 font-mono text-sm break-all">
                                                                    {formData.paymentMethod === 'd17' ? (storeSettings?.payment_methods_config?.d17?.details || t('checkout.payment.no_info')) : (storeSettings?.payment_methods_config?.bank_transfer?.details || t('checkout.payment.no_info'))}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3 text-primary" /> {t('checkout.payment.ref_info')}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('checkout.review.ref')}</Label>
                                                                <Input
                                                                    className="h-12 bg-muted/20 border-border/50 rounded-xl"
                                                                    placeholder={t('checkout.placeholder.ref')}
                                                                    value={formData.paymentReference}
                                                                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="mt-8 pt-6 border-t">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('checkout.review.notes')}</Label>
                                                    <textarea
                                                        rows={2}
                                                        className="w-full flex rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all mt-2"
                                                        placeholder={t('checkout.placeholder.notes')}
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Summarized confirmation checklist */}
                                        <div className="p-4 bg-muted/20 rounded-2xl border border-border/30 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {t('checkout.review.as')} <span className="text-foreground">{formData.name} ({formData.phone})</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {t('checkout.delivery')}: <span className="text-foreground">
                                                    {formData.deliveryMethod === 'pickup' ? t('checkout.delivery.pickup') :
                                                        formData.deliveryMethod === 'rapid_post' ? t('checkout.delivery.post') :
                                                            t('checkout.delivery.local')}
                                                </span>
                                            </div>
                                            {formData.address && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {t('checkout.details.address')}: <span className="text-foreground truncate max-w-[200px]">{formData.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Order Summary (Sidebar) */}
                    <div className="lg:col-span-1">
                        <Card className="glass-card shadow-2xl border-border/30 sticky top-28 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <CardHeader className="pb-4 relative z-10">
                                <CardTitle className="text-lg uppercase tracking-tight">{t('checkout.summary.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 relative z-10">
                                <div className="space-y-3">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="flex justify-between text-xs font-medium">
                                            <span className="text-muted-foreground truncate flex-1 pe-4">{item.quantity}x {item.name}</span>
                                            <span className="font-mono">{(item.quantity * (item.salePrice || item.price)).toFixed(3)} {t('services.currency')}</span>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-border/20" />

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center group cursor-help">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            {t('sales.summary')}
                                            <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                        <span className="font-mono">{cartTotal.toFixed(3)} {t('services.currency')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">{t('checkout.details.delivery')}</span>
                                        <span className="text-[10px] font-black uppercase text-primary tracking-tighter bg-primary/10 px-2 py-0.5 rounded-full">
                                            {formData.deliveryMethod}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">{t('checkout.delivery')}</span>
                                        <span className={`font-mono ${deliveryCost === 0 ? 'text-green-500 font-bold' : ''}`}>
                                            {deliveryCost === 0 ? t('checkout.delivery.free').toUpperCase() : `${deliveryCost.toFixed(3)} ${t('services.currency')}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-dashed border-border/50">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">{t('checkout.summary.total_payable')}</span>
                                        <span className="text-primary text-[10px] font-bold">{t('services.currency')} (TND)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-3xl font-black font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                            {total.toFixed(3)}
                                        </span>
                                        <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-none text-[10px] uppercase font-black tracking-widest rounded-lg px-2">
                                            {t('checkout.summary.confirmed')}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3 pt-6 pb-8 relative z-10">
                                <Button
                                    className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 group relative overflow-hidden active:scale-95 transition-all"
                                    onClick={handleNext}
                                    disabled={createOrder.isPending}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] z-0"
                                        animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span className="relative z-10 flex items-center gap-2">
                                        {createOrder.isPending ? (
                                            t('dashboard.loading').split('...')[0] + "..."
                                        ) : step === 'cart' ? (
                                            <>{t('checkout.btn.continue')} {isRTL ? <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}</>
                                        ) : step === 'details' ? (
                                            <>{t('checkout.btn.review')} {isRTL ? <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}</>
                                        ) : (
                                            <>{t('checkout.btn.confirm')} <CheckCircle2 className="w-5 h-5" /></>
                                        )}
                                    </span>
                                </Button>

                                {step !== 'cart' && (
                                    <Button
                                        variant="ghost"
                                        className="w-full h-10 text-muted-foreground hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest"
                                        onClick={() => setStep(step === 'details' ? 'cart' : 'details')}
                                    >
                                        <ArrowLeft className="me-2 w-4 h-4" /> {t('checkout.btn.back')}
                                    </Button>
                                )}

                                <p className="text-[10px] text-center text-muted-foreground mt-2 px-4 italic leading-tight">
                                    {t('checkout.terms')} <br />
                                    By confirming, you agree to our <a href="/terms" target="_blank" className="text-primary hover:underline">Terms</a> & <a href="/delivery" target="_blank" className="text-primary hover:underline">Delivery Conditions</a>.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Bottom Action Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-lg border-t border-primary/20 animate-in slide-in-from-bottom-full duration-500">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('checkout.summary.total_payable')}</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {total.toFixed(3)} {t('services.currency')}
                        </span>
                    </div>
                    <Button
                        className="flex-1 h-12 shadow-lg shadow-primary/20"
                        size="lg"
                        onClick={handleNext}
                        disabled={createOrder.isPending}
                    >
                        {createOrder.isPending ? (
                            t('dashboard.loading').split('...')[0] + "..."
                        ) : step === 'cart' ? (
                            <span className="flex items-center gap-1">{t('checkout.btn.continue')} <ArrowRight className="w-4 h-4" /></span>
                        ) : (
                            <span className="flex items-center gap-1">{t('checkout.btn.confirm')}</span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
