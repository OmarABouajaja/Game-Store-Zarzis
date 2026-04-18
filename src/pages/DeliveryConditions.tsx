import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Clock, Package } from "lucide-react";

const DeliveryConditions = () => {
    const { t } = useLanguage();

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Truck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold">{t("delivery.title")}</h1>
                        <p className="text-muted-foreground">{t("delivery.subtitle")}</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="glass-card md:col-span-3">
                        <CardHeader>
                            <CardTitle>{t("delivery.methods.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-lg bg-background/50 border border-border/50 flex items-start gap-4">
                                <MapPin className="w-6 h-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{t("delivery.local.title")}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">{t("delivery.local.desc")}</p>
                                    <ul className="text-sm space-y-1">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {t("delivery.cost")}: <strong>7.000 DT</strong>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {t("delivery.time")}: {t("delivery.local.time")}
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-background/50 border border-border/50 flex items-start gap-4">
                                <Package className="w-6 h-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{t("delivery.rapid.title")}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">{t("delivery.rapid.desc")}</p>
                                    <ul className="text-sm space-y-1">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {t("delivery.cost")}: <strong>10.000 DT</strong>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {t("delivery.time")}: {t("delivery.rapid.time")}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            {t("delivery.processing.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm md:text-base">
                        <p>{t("delivery.processing.text")}</p>
                        <p className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm">
                            <strong>{t("delivery.processing.note_label")}:</strong> {t("delivery.processing.note_text")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>{t("delivery.return.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>{t("delivery.return.intro")}</p>
                        <ul className="list-disc ps-4 space-y-1">
                            <li>{t("delivery.return.rule1")}</li>
                            <li>{t("delivery.return.rule2")}</li>
                            <li>{t("delivery.return.rule3")}</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default DeliveryConditions;
