import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Scale, AlertCircle, HelpCircle } from "lucide-react";

const TermsOfService = () => {
    const { t, language } = useLanguage();

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold">{t("terms.title")}</h1>
                        <p className="text-muted-foreground">{t("terms.last_updated")}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-US')}</p>
                    </div>
                </div>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t("terms.agreement.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-4 text-sm md:text-base">
                        <p>{t("terms.agreement.content")}</p>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <Shield className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{t("terms.gaming_rules.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 text-muted-foreground">
                            <ul className="list-disc ps-4 space-y-2">
                                <li>{t("terms.gaming_rules.rule1")}</li>
                                <li>{t("terms.gaming_rules.rule2")}</li>
                                <li>{t("terms.gaming_rules.rule3")}</li>
                                <li>{t("terms.gaming_rules.rule4")}</li>
                                <li>{t("terms.gaming_rules.rule5")}</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{t("terms.account.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 text-muted-foreground">
                            <ul className="list-disc ps-4 space-y-2">
                                <li>{t("terms.account.rule1")}</li>
                                <li>{t("terms.account.rule2")}</li>
                                <li>{t("terms.account.rule3")}</li>
                                <li>{t("terms.account.rule4")}</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t("terms.services.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm md:text-base">
                        <p>
                            <strong>{t("terms.services.warranty_label")}:</strong> {t("terms.services.warranty_text")}
                        </p>
                        <p>
                            <strong>{t("terms.services.data_label")}:</strong> {t("terms.services.data_text")}
                        </p>
                        <p>
                            <strong>{t("terms.services.unclaimed_label")}:</strong> {t("terms.services.unclaimed_text")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t("terms.contact.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <HelpCircle className="w-10 h-10 text-muted-foreground" />
                        <div>
                            <p>{t("terms.contact.question")}</p>
                            <p className="text-muted-foreground">{t("terms.contact.visit")}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default TermsOfService;
