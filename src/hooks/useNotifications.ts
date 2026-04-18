/**
 * useNotifications Hook
 * 
 * Provides convenient functions for sending notifications throughout the app.
 * Integrates with EmailJS for email delivery.
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    sendBookingConfirmation,
    sendContactForm,
    sendServiceRequestNotification,
    sendSessionReceipt,
    BookingEmailData,
    ContactFormData,
    ServiceRequestEmailData,
    SessionReceiptData,
} from '@/services/emailService';

export function useNotifications() {
    const { toast } = useToast();
    const { t } = useLanguage();

    /**
     * Send booking confirmation and show toast
     */
    const notifyBookingConfirmation = useCallback(async (data: BookingEmailData) => {
        try {
            const success = await sendBookingConfirmation(data);

            if (success) {
                toast({
                    title: "✅ Réservation confirmée",
                    description: `Email de confirmation envoyé à ${data.clientEmail || data.clientPhone}`,
                });
            } else {
                toast({
                    title: "⚠️ Réservation enregistrée",
                    description: "Email non envoyé - vérifiez la configuration EmailJS",
                    variant: "destructive",
                });
            }

            return success;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }, [toast]);

    /**
     * Send contact form and show toast
     */
    const notifyContactForm = useCallback(async (data: ContactFormData) => {
        try {
            const success = await sendContactForm(data);

            if (success) {
                toast({
                    title: "✅ Message envoyé",
                    description: "Nous vous répondrons dans les plus brefs délais",
                });
            } else {
                toast({
                    title: "❌ Erreur d'envoi",
                    description: "Impossible d'envoyer le message. Réessayez plus tard.",
                    variant: "destructive",
                });
            }

            return success;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }, [toast]);

    /**
     * Send service request notification and show toast
     */
    const notifyServiceRequest = useCallback(async (data: ServiceRequestEmailData) => {
        try {
            const success = await sendServiceRequestNotification(data);

            if (success) {
                toast({
                    title: "✅ Demande de service créée",
                    description: `Numéro de suivi: ${data.requestId}`,
                });
            }

            return success;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }, [toast]);

    /**
     * Send session receipt and show toast
     */
    const notifySessionComplete = useCallback(async (data: SessionReceiptData) => {
        try {
            const success = await sendSessionReceipt(data);

            if (success) {
                toast({
                    title: "✅ Session terminée",
                    description: `Reçu envoyé à ${data.clientEmail}`,
                });
            }

            return success;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }, [toast]);

    /**
     * Show local toast notification (no email)
     */
    const notifyLocal = useCallback((title: string, description?: string, variant?: 'default' | 'destructive') => {
        toast({
            title,
            description,
            variant: variant || 'default',
        });
    }, [toast]);

    return {
        notifyBookingConfirmation,
        notifyContactForm,
        notifyServiceRequest,
        notifySessionComplete,
        notifyLocal,
    };
}

export default useNotifications;
