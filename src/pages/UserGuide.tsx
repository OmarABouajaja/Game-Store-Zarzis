import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, Shield, Monitor, Gamepad2, Users, DollarSign, Settings, Bell, ShoppingBag, Truck, Receipt } from "lucide-react";

// User Guide Content
const guideContent = {
    fr: {
        title: "Guide Utilisateur Complet",
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
                    text: "Utilisez le sélecteur dans la barre de navigation pour basculer entre Français, Anglais et Arabe. L'interface s'adapte automatiquement (LTR/RTL)."
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
                    text: "Après un certain nombre de parties (ex: 5), une partie gratuite est automatiquement déduite du total."
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
                    text: "Enregistrez vos dépenses dans l'onglet 'Dépenses'. Distinguez les charges quotidiennes (ex: nettoyage) des charges mensuelles (ex: loyer, électricité)."
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
        title: "Complete User Guide",
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
                    text: "Use the selector in the navbar to switch between French, English, and Arabic. The interface adapts automatically (LTR/RTL)."
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
                    text: "Every dinar spent earns points (configurable). Clients can redeem these points for free sessions."
                }
            ],
            products: [
                {
                    title: "Stock Management",
                    text: "In 'Products', add items (drinks, snacks, electronics). Stock decreases automatically upon sale."
                },
                {
                    title: "Low Stock Alerts",
                    text: "If a product reaches critical level (< 5 units), an alert appears on the Dashboard."
                }
            ],
            expenses: [
                {
                    title: "Expense Tracking",
                    text: "Record expenses in the 'Expenses' tab. Distinguish daily costs (e.g., cleaning) from monthly ones (e.g., rent, utilities)."
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
        title: "دليل المستخدم الشامل",
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
                    text: "لوحة التحكم هي مركز القيادة الخاص بك. تعرض المؤشرات الرئيسية في الوقت الفعلي (الإيرادات، الجلسات النشطة، تنبيهات المخزون)."
                },
                {
                    title: "تغيير اللغة",
                    text: "استخدم المحدد في شريط التنقل للتبديل بين الفرنسية، الإنجليزية والعربية. تتكيف الواجهة تلقائيًا (يمين لليسار)."
                }
            ],
            sessions: [
                {
                    title: "بدء جلسة",
                    text: "انقر فوق 'جلسات' > 'جلسة جديدة'. اختر الجهاز والعميل. يبدأ المؤقت تلقائيًا."
                },
                {
                    title: "إنهاء الجلسة",
                    text: "انقر فوق 'إنهاء'. يقوم النظام بحساب الإجمالي (الوقت + الاستهلاكات). يمكنك الاختيار بين عدد الألعاب الفعلي أو المقترح."
                },
                {
                    title: "لعبة مجانية",
                    text: "بعد عدد X من الألعاب (قابل للتكوين)، يتم خصم 'لعبة مجانية' تلقائيًا من المجموع."
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
                    text: "إذا وصل المنتج إلى مستوى حرج (< 5 وحدات)، يظهر تنبيه على لوحة التحكم."
                }
            ],
            expenses: [
                {
                    title: "تتبع المصاريف",
                    text: "سجل مصاريفك في تبويب 'المصاريف'. ميز بين المصاريف اليومية (مثل التنظيف) والشهرية (مثل الإيجار والكهرباء)."
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
                    text: "إدارة التوصيل المحلي أو عبر البريد السريع. تضاف رسوم التوصيل إلى المجموع."
                }
            ],
            security: [
                {
                    title: "تصريح محطة العمل",
                    text: "للأمان، قم بتعيين هذا الكمبيوتر كـ 'محطة مصرح بها' في الإعدادات. هذا يفعل تسجيل حضور الموظفين تلقائيًا."
                }
            ]
        }
    }
};

const UserGuide = () => {
    const { language, dir } = useLanguage();
    const content = guideContent[language] || guideContent.fr;
    const isRTL = dir === 'rtl';

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <Book className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold font-display">{content.title}</h1>
                </div>

                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="flex flex-wrap h-auto p-1 bg-muted/50 mb-6 w-full justify-start gap-2">
                        <TabsTrigger value="dashboard" className="gap-2"><Monitor className="w-4 h-4" /> {content.sections.dashboard}</TabsTrigger>
                        <TabsTrigger value="sessions" className="gap-2"><Gamepad2 className="w-4 h-4" /> {content.sections.sessions}</TabsTrigger>
                        <TabsTrigger value="clients" className="gap-2"><Users className="w-4 h-4" /> {content.sections.clients}</TabsTrigger>
                        <TabsTrigger value="products" className="gap-2"><ShoppingBag className="w-4 h-4" /> {content.sections.products}</TabsTrigger>
                        <TabsTrigger value="expenses" className="gap-2"><Receipt className="w-4 h-4" /> {content.sections.expenses}</TabsTrigger>
                        <TabsTrigger value="orders" className="gap-2"><Truck className="w-4 h-4" /> {content.sections.orders}</TabsTrigger>
                        <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> {content.sections.security}</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[600px] rounded-md border p-4 bg-card/50 backdrop-blur-sm">
                        {Object.keys(content.content).map((key) => (
                            <TabsContent key={key} value={key} className="mt-0 space-y-4">
                                {content.content[key as keyof typeof content.content].map((item: any, idx: number) => (
                                    <Card key={idx} className="glass-card">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-primary flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                {item.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">{item.text}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>
                        ))}
                    </ScrollArea>
                </Tabs>
            </div>
        </div>
    );
};

export default UserGuide;
