import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Shield, Monitor, Gamepad2, Users, ShoppingBag, Truck, Receipt, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// User Guide Content
const guideContent = {
    fr: {
        title: "Guide Utilisateur",
        sections: {
            dashboard: "Tableau de Bord",
            sessions: "Sessions",
            clients: "Clients",
            products: "Produits",
            expenses: "Dépenses",
            orders: "Commandes",
            security: "Sécurité"
        },
        content: {
            dashboard: [
                {
                    title: "Vue d'ensemble",
                    text: "Le tableau de bord est votre centre de commandement. Il affiche les indicateurs clés en temps réel (revenus, sessions actives, alertes de stock)."
                },
                {
                    title: "Changement de Langue",
                    text: "Utilisez le sélecteur dans la barre de navigation pour basculer entre Français, Anglais et Arabe. L'interface s'adapte automatiquement."
                }
            ],
            sessions: [
                {
                    title: "Lancer une Session",
                    text: "Cliquez sur 'Sessions' > 'Nouvelle Session'. Sélectionnez la console et le client. Le chronomètre démarre automatiquement."
                },
                {
                    title: "Fin de Session",
                    text: "Cliquez sur 'Terminer'. Le système calcule le montant total (Temps + Consommations). Vous pouvez choisir entre le nombre de jeux réel ou suggéré."
                },
                {
                    title: "Jeu Gratuit",
                    text: "Après un certain nombre de parties, une partie gratuite est automatiquement déduite du total."
                }
            ],
            clients: [
                {
                    title: "Ajouter un Client",
                    text: "Allez dans 'Clients' > '+ Nouveau Client'. Saisissez le nom et le téléphone. L'historique des visites est suivi automatiquement."
                },
                {
                    title: "Points de Fidélité",
                    text: "Chaque dinar dépensé génère des points (configurable). Les clients peuvent échanger ces points contre des sessions gratuites."
                }
            ],
            products: [
                {
                    title: "Gestion du Stock",
                    text: "Dans 'Produits', ajoutez vos articles (boissons, snacks, électroniques). Le stock diminue automatiquement lors des ventes."
                },
                {
                    title: "Alertes Niveau Bas",
                    text: "Si un produit atteint le seuil critique (< 5 unités), une alerte apparaît sur le Tableau de Bord."
                }
            ],
            expenses: [
                {
                    title: "Suivi des Charges",
                    text: "Enregistrez vos dépenses dans l'onglet 'Dépenses'. Distinguez les charges quotidiennes des charges mensuelles."
                },
                {
                    title: "Calcul Marge",
                    text: "Le système déduit automatiquement ces charges du Chiffre d'Affaires pour calculer votre Profit Net."
                }
            ],
            orders: [
                {
                    title: "Gestion Commandes",
                    text: "Les commandes en ligne apparaissent ici. Vous pouvez changer le statut : En attente > En préparation > Livré."
                },
                {
                    title: "Livraison",
                    text: "Gérez les livraisons locales ou par Rapid Post. Les frais de livraison sont ajoutés au total."
                }
            ],
            security: [
                {
                    title: "Poste de Travail",
                    text: "Sécurisez l'accès en définissant ce PC comme 'Poste Autorisé' dans les paramètres. Cela active le pointage automatique du personnel."
                }
            ]
        }
    },
    en: {
        title: "User Guide",
        sections: {
            dashboard: "Dashboard",
            sessions: "Sessions",
            clients: "Clients",
            products: "Products",
            expenses: "Expenses",
            orders: "Orders",
            security: "Security"
        },
        content: {
            dashboard: [
                {
                    title: "Overview",
                    text: "The dashboard is your command center. It displays key real-time metrics (revenue, active sessions, stock alerts)."
                },
                {
                    title: "Changing Language",
                    text: "Use the selector in the navbar to switch between French, English, and Arabic. The interface adapts automatically."
                }
            ],
            sessions: [
                {
                    title: "Starting a Session",
                    text: "Click 'Sessions' > 'New Session'. Select the console and client. The timer starts automatically."
                },
                {
                    title: "Ending a Session",
                    text: "Click 'End'. The system calculates the total (Time + Consumables). You can choose between manual or suggested game counts."
                },
                {
                    title: "Free Game Program",
                    text: "After X games (configurable), a 'Free Game' is automatically deducted from the total."
                }
            ],
            clients: [
                {
                    title: "Adding a Client",
                    text: "Go to 'Clients' > '+ New Client'. Enter name and phone. Visit history is tracked automatically."
                },
                {
                    title: "Loyalty Points",
                    text: "Every dinar spent earns points. Clients can redeem these points for free sessions."
                }
            ],
            products: [
                {
                    title: "Stock Management",
                    text: "In 'Products', add items (drinks, snacks, electronics). Stock decreases automatically upon sale."
                },
                {
                    title: "Low Stock Alerts",
                    text: "If a product reaches critical level, an alert appears on the Dashboard."
                }
            ],
            expenses: [
                {
                    title: "Expense Tracking",
                    text: "Record expenses in the 'Expenses' tab. Distinguish daily costs from monthly ones."
                },
                {
                    title: "Margin Calculation",
                    text: "The system automatically deducts these expenses from Revenue to calculate Net Profit."
                }
            ],
            orders: [
                {
                    title: "Order Management",
                    text: "Online orders appear here. You can change status: Pending > Processing > Delivered."
                },
                {
                    title: "Delivery",
                    text: "Manage local or Rapid Post deliveries. Shipping fees are added to the total."
                }
            ],
            security: [
                {
                    title: "Work Station",
                    text: "Secure access by designating this PC as 'Authorized Station' in settings. This enables automatic staff clock-in."
                }
            ]
        }
    },
    ar: {
        title: "دليل المستخدم",
        sections: {
            dashboard: "لوحة التحكم",
            sessions: "الجلسات",
            clients: "العملاء",
            products: "المنتجات",
            expenses: "المصاريف",
            orders: "الطلبات",
            security: "الأمان"
        },
        content: {
            dashboard: [
                {
                    title: "نظرة عامة",
                    text: "لوحة التحكم هي مركز القيادة الخاص بك. تعرض المؤشرات الرئيسية في الوقت الفعلي."
                },
                {
                    title: "تغيير اللغة",
                    text: "استخدم المحدد في شريط التنقل للتبديل بين اللغات. تتكيف الواجهة تلقائيًا."
                }
            ],
            sessions: [
                {
                    title: "بدء جلسة",
                    text: "انقر فوق 'جلسات' > 'جلسة جديدة'. اختر الجهاز والعميل. يبدأ المؤقت تلقائيًا."
                },
                {
                    title: "إنهاء الجلسة",
                    text: "انقر فوق 'إنهاء'. يقوم النظام بحساب الإجمالي (الوقت + الاستهلاكات)."
                },
                {
                    title: "لعبة مجانية",
                    text: "بعد عدد X من الألعاب، يتم خصم 'لعبة مجانية' تلقائيًا من المجموع."
                }
            ],
            clients: [
                {
                    title: "إضافة عميل",
                    text: "اذهب إلى 'العملاء' > '+ عميل جديد'. أدخل الاسم ورقم الهاتف. يتم تتبع سجل الزيارات تلقائيًا."
                },
                {
                    title: "نقاط الولاء",
                    text: "كل دينار يتم إنفاقه يولد نقاطًا. يمكن للعملاء استبدال هذه النقاط بجلسات مجانية."
                }
            ],
            products: [
                {
                    title: "إدارة المخزون",
                    text: "في 'المنتجات'، أضف العناصر (المشروبات، الإلكترونيات). ينقص المخزون تلقائيًا عند البيع."
                },
                {
                    title: "تنبيهات المخزون المنخفض",
                    text: "إذا وصل المنتج إلى مستوى حرج، يظهر تنبيه على لوحة التحكم."
                }
            ],
            expenses: [
                {
                    title: "تتبع المصاريف",
                    text: "سجل مصاريفك في تبويب 'المصاريف'. ميز بين المصاريف اليومية والشهرية."
                },
                {
                    title: "حساب الربح",
                    text: "يقوم النظام بخصم هذه المصاريف تلقائيًا من الإيرادات لحساب صافي الربح."
                }
            ],
            orders: [
                {
                    title: "إدارة الطلبات",
                    text: "تظهر الطلبات عبر الإنترنت هنا. يمكنك تغيير الحالة: قيد الانتظار > قيد التجهيز > تم التسليم."
                },
                {
                    title: "التوصيل",
                    text: "إدارة التوصيل المحلي. تضاف رسوم التوصيل إلى المجموع."
                }
            ],
            security: [
                {
                    title: "تصريح محطة العمل",
                    text: "قم بتعيين هذا الكمبيوتر كـ 'محطة مصرح بها' في الإعدادات لتفعيل تسجيل حضور الموظفين تلقائيًا."
                }
            ]
        }
    }
};

const UserGuide = () => {
    const { language } = useLanguage();
    const content = guideContent[language] || guideContent.fr;
    const [activeTab, setActiveTab] = useState("dashboard");

    const tabs = [
        { id: "dashboard", icon: Monitor, label: content.sections.dashboard },
        { id: "sessions", icon: Gamepad2, label: content.sections.sessions },
        { id: "clients", icon: Users, label: content.sections.clients },
        { id: "products", icon: ShoppingBag, label: content.sections.products },
        { id: "expenses", icon: Receipt, label: content.sections.expenses },
        { id: "orders", icon: Truck, label: content.sections.orders },
        { id: "security", icon: Shield, label: content.sections.security },
    ];

    return (
        <div className="min-h-screen bg-background pb-20 selection:bg-primary/30 font-sans">
            <Navbar />
            
            {/* Hero Section */}
            <div className="relative pt-24 pb-12 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.3)] mb-2">
                            <Book className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                            {content.title}
                        </h1>
                        <p className="text-muted-foreground max-w-2xl text-lg">
                            {language === 'fr' ? "Découvrez comment utiliser le système de gestion pour optimiser votre espace gaming." : 
                             language === 'en' ? "Learn how to use the management system to optimize your gaming lounge." : 
                             "تعرف على كيفية استخدام نظام الإدارة لتحسين مساحة الألعاب الخاصة بك."}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Navigation Sidebar */}
                    <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24 z-10">
                        {/* Mobile Scrollable horizontal list, Desktop vertical list */}
                        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-none snap-x" style={{ scrollbarWidth: 'none' }}>
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap snap-start text-sm md:text-base",
                                            isActive 
                                                ? "bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.15)] border border-primary/30 scale-[1.02]" 
                                                : "bg-card/30 text-muted-foreground hover:bg-card/80 hover:text-white border border-transparent hover:border-white/5"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground opacity-70")} />
                                        <span>{tab.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4 ms-auto hidden lg:block opacity-50" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                            {(() => {
                                                const activeIcon = tabs.find(t => t.id === activeTab)?.icon || Book;
                                                const Icon = activeIcon;
                                                return <Icon className="w-6 h-6 text-primary" />;
                                            })()}
                                        </div>
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </h2>
                                    <div className="h-1 w-24 bg-gradient-to-r from-primary/80 to-transparent mt-5 rounded-full" />
                                </div>

                                <div className="grid gap-6">
                                    {content.content[activeTab as keyof typeof content.content]?.map((item: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                                        >
                                            <Card className="glass-card overflow-hidden group border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-gradient-to-br from-card/40 to-background/40">
                                                {/* Animated gradient border top */}
                                                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-lg md:text-xl text-white flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                                            {idx + 1}
                                                        </div>
                                                        {item.title}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base ps-11">
                                                        {item.text}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
