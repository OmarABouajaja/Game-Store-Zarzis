import os
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.api_key = os.getenv("SMS_API_KEY")
        self.provider_url = os.getenv("SMS_PROVIDER_URL", "https://api.sms-provider.com/send")
        self.enabled = os.getenv("SMS_ENABLED", "False").lower() == "true"

    def send_sms(self, to_number: str, message: str) -> bool:
        """
        Send an SMS to the specified number.
        
        Args:
            to_number: The recipient's phone number (E.164 format preferred).
            message: The message body.
            
        Returns:
            bool: True if sent successfully (or disabled/mocked), False otherwise.
        """
        if not self.enabled:
            logger.info(f"SMS Service Disabled. Would send to {to_number}: {message}")
            return True

        if not self.api_key:
            logger.error("SMS_API_KEY is not set.")
            return False

        try:
            # Generic payload structure - adjust based on actual provider (e.g., Twilio, Bird, etc.)
            payload = {
                "to": to_number,
                "body": message,
                "api_key": self.api_key
            }
            
            # Use sync requests
            response = requests.post(self.provider_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"SMS sent successfully to {to_number}")
                return True
            else:
                logger.error(f"Failed to send SMS: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.exception(f"Exception sending SMS: {str(e)}")
            return False

# Singleton instance
sms_service = SMSService()
