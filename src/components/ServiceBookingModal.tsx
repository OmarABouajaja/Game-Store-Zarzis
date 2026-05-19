import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Loader2, Wrench, Phone, User, MessageSquare, Monitor } from "lucide-react";
import { useData } from "@/contexts/DataContext";

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  serviceCategory?: string;
}

export function ServiceBookingModal({ isOpen, onClose, serviceName, serviceCategory }: ServiceBookingModalProps) {
  const { t, language } = useLanguage();
  const { settings } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = settings?.contact_info || {};
  const whatsappPhone = contactInfo.whatsapp || "+21629290065";
  const cleanWhatsapp = whatsappPhone.replace(/\D/g, '');

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    brand: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn';
      
      const payload = {
        client_name: formData.name,
        client_phone: formData.phone,
        device_type: serviceCategory || "Général",
        device_brand: formData.brand || "Non spécifié",
        issue_description: `[Service: ${serviceName}] ${formData.description}`,
        request_id: `SRV-${Math.floor(Math.random() * 100000)}`,
        status: 'pending'
      };

      // Call Cloudflare Worker API
      const res = await fetch(`${backendUrl}/email/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to send service request email");
      }

      toast.success(language === 'fr' ? "Demande envoyée avec succès !" : (language === 'ar' ? "تم إرسال الطلب بنجاح!" : "Request sent successfully!"));
      
      // WhatsApp Fallback (Option A chosen by user)
      const whatsappMessage = `*Demande de Service: ${serviceName}*\n\n*Nom:* ${formData.name}\n*Téléphone:* ${formData.phone}\n*Appareil:* ${serviceCategory} - ${formData.brand}\n*Description:*\n${formData.description}`;
      window.open(`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
      
      onClose();
      setFormData({ name: "", phone: "", brand: "", description: "" });
    } catch (error) {
      console.error("Error sending service request:", error);
      // Fallback to pure whatsapp if API fails
      toast.error(language === 'fr' ? "Erreur réseau, redirection vers WhatsApp..." : "Network error, redirecting to WhatsApp...");
      
      const whatsappMessage = `*Demande de Service: ${serviceName}*\n\n*Nom:* ${formData.name}\n*Téléphone:* ${formData.phone}\n*Appareil:* ${serviceCategory} - ${formData.brand}\n*Description:*\n${formData.description}`;
      window.open(`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden p-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold text-primary">
              <Wrench className="w-5 h-5" />
              {t("contact.form.title") || "Demande de Service"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {serviceName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> {t("contact.form.name")}
                </Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont" 
                  required 
                  className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {t("contact.phone")}
                </Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="29 290 065" 
                  required 
                  className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Marque / Modèle
              </Label>
              <Input 
                id="brand" 
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ex: PlayStation 5, iPhone 13..." 
                className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {t("contact.form.message")}
              </Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre problème en détail..." 
                required 
                rows={4}
                className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 transition-all resize-none"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 transition-all h-12"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="font-bold text-sm tracking-wide">
                    {t("contact.form.send")}
                  </span>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground mt-3">
                * Une fenêtre WhatsApp s'ouvrira après l'envoi pour un suivi direct.
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
