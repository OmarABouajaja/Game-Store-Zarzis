import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp, Newspaper } from "lucide-react";
import { memo, useState } from "react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

const NewsShowcase = () => {
    const { blogPosts } = useData();
    const { t, language } = useLanguage();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const publishedPosts = blogPosts
        .filter(post => post.is_published)
        .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());

    if (publishedPosts.length === 0) {
        return null;
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getLocale = () => {
        switch (language) {
            case 'fr': return fr;
            case 'ar': return fr; // Use FR for date formatting in AR if AR locale not available
            default: return enUS;
        }
    };

    return (
        <section id="news" className="py-8 sm:py-12 md:py-16 lg:py-20 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

            <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
                <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                    <span className="text-primary font-display text-[10px] sm:text-xs md:text-sm tracking-widest uppercase mb-2 sm:mb-3 block">
                        {t("news.latest")}
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
                        {t("news.title")}
                        <span
                            className="text-gradient"
                            style={{
                                animation: 'rgb-shift 8s ease-in-out infinite'
                            }}
                        >
                            {' '}{t("news.title_suffix")}
                        </span>
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-4">
                        {t("news.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {publishedPosts.map((post) => {
                        const isExpanded = expandedId === post.id;
                        const title = language === 'ar' ? post.title_ar : (language === 'fr' ? post.title_fr : post.title);
                        const content = language === 'ar' ? post.content_ar : (language === 'fr' ? post.content_fr : post.content);
                        const date = post.published_at || post.created_at;

                        return (
                            <Card
                                key={post.id}
                                className={`group glass-card rounded-lg sm:rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:shadow-[0_12px_32px_hsl(var(--primary)/0.15)] flex flex-col h-fit ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
                            >
                                <CardContent className="p-0 flex flex-col md:flex-row">
                                    {post.image_url && !isExpanded && (
                                        <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden">
                                            <img
                                                src={post.image_url}
                                                alt={title || ""}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    {post.image_url && isExpanded && (
                                        <div className="w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                                            <img
                                                src={post.image_url}
                                                alt={title || ""}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    <div className={`p-4 sm:p-6 flex-1 flex flex-col ${isExpanded ? 'md:w-3/5' : ''}`}>
                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                            {date && format(new Date(date), 'PPP', { locale: getLocale() })}
                                        </div>

                                        <h3 className={`font-display font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors ${isExpanded ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base sm:text-lg'}`}>
                                            {title}
                                        </h3>

                                        <div className={`text-muted-foreground text-xs sm:text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                                            {isExpanded ? (
                                                <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                                                    {content}
                                                </div>
                                            ) : (
                                                post.excerpt || content?.substring(0, 150) + "..."
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-4 w-fit text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto font-bold"
                                            onClick={() => toggleExpand(post.id)}
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-4 h-4 me-1" />
                                                    {t("news.show_less")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4 me-1" />
                                                    {t("news.read_more")}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default memo(NewsShowcase);
