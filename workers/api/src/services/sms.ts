/**
 * SMS Service for Cloudflare Workers.
 * Generic provider integration via REST API.
 */
import type { Env } from '../types';

export class SMSService {
  private apiKey: string | undefined;
  private providerUrl: string;
  private enabled: boolean;

  constructor(env: Env) {
    this.apiKey = env.SMS_API_KEY;
    this.providerUrl = env.SMS_PROVIDER_URL || 'https://api.sms-provider.com/send';
    this.enabled = (env.SMS_ENABLED || 'false').toLowerCase() === 'true';
  }

  async sendSMS(toNumber: string, message: string): Promise<boolean> {
    if (!this.enabled) {
      console.log(`SMS Service Disabled. Would send to ${toNumber}: ${message}`);
      return true;
    }

    if (!this.apiKey) {
      console.error('SMS_API_KEY is not set.');
      return false;
    }

    try {
      const response = await fetch(this.providerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toNumber,
          body: message,
          api_key: this.apiKey,
        }),
      });

      if (response.ok) {
        console.log(`SMS sent successfully to ${toNumber}`);
        return true;
      } else {
        console.error(`Failed to send SMS: ${response.status} - ${await response.text()}`);
        return false;
      }
    } catch (e) {
      console.error(`Exception sending SMS: ${e}`);
      return false;
    }
  }
}
