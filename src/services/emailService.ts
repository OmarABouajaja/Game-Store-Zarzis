/**
 * Email Service API Client
 * Sends requests to the Python Backend which handles MailerSend integration
 */

const rawUrl = import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn';
const API_BASE_URL = `${rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`}/email`;

export interface BookingEmailData {
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    consoleType: string;
    sessionType: 'hourly' | 'per_game';
    preferredDate?: string;
    preferredTime?: string;
}

export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export interface ServiceRequestEmailData {
    clientName: string;
    clientPhone: string;
    deviceType: string;
    deviceBrand: string;
    deviceModel: string; // Not used in current backend endpoint but kept for interface compatibility
    issueDescription: string;
    requestId: string;
    status?: string;
}

export interface SessionReceiptData {
    clientName: string;
    clientEmail: string;
    consoleType: string;
    sessionType: string;
    duration: string;
    totalAmount: number;
    pointsEarned: number;
    date: string;
}

/**
 * Send booking confirmation via Backend API
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: data.clientName,
                client_email: data.clientEmail,
                console_type: data.consoleType,
                session_type: data.sessionType === 'hourly' ? 'Par heure' : 'Par partie',
                preferred_date: data.preferredDate,
                preferred_time: data.preferredTime,
            }),
        });
        return response.ok;
    } catch (error) {
        console.error('❌ API Call Failed:', error);
        return false;
    }
}

/**
 * Send contact form via Backend API
 */
export async function sendContactForm(data: ContactFormData): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-form`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from_name: data.name,
                from_email: data.email,
                subject: data.subject,
                message: data.message,
            }),
        });
        return response.ok;
    } catch (error) {
        console.error('❌ API Call Failed:', error);
        return false;
    }
}

/**
 * Send service request notification via Backend API
 */
export async function sendServiceRequestNotification(data: ServiceRequestEmailData): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/service-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: data.clientName,
                client_phone: data.clientPhone,
                device_type: data.deviceType,
                device_brand: data.deviceBrand,
                issue_description: data.issueDescription,
                request_id: data.requestId,
                status: data.status || "pending",
            }),
        });
        return response.ok;
    } catch (error) {
        console.error('❌ API Call Failed:', error);
        return false;
    }
}

/**
 * Send session receipt via Backend API
 */
export async function sendSessionReceipt(data: SessionReceiptData): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/session-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: data.clientName,
                client_email: data.clientEmail,
                console_type: data.consoleType,
                duration: data.duration,
                total_amount: data.totalAmount,
                points_earned: data.pointsEarned,
                date: data.date,
            }),
        });
        return response.ok;
    } catch (error) {
        console.error('❌ API Call Failed:', error);
        return false;
    }
}

export interface StaffAttendanceData {
    staffName: string;
    action: 'clock_in' | 'clock_out';
    time: string;
}

/**
 * Send staff attendance notification via Backend API
 */
export async function sendStaffAttendanceNotification(data: StaffAttendanceData): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/staff-attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                staff_name: data.staffName,
                action: data.action,
                time: data.time,
            }),
        });
        return response.ok;
    } catch (error) {
        // Silently fail for now as email service might not be critical path
        console.warn('⚠️ Attendance Email Failed:', error);
        return false;
    }
}

export default {
    sendBookingConfirmation,
    sendContactForm,
    sendServiceRequestNotification,
    sendSessionReceipt,
    sendStaffAttendanceNotification,
};
