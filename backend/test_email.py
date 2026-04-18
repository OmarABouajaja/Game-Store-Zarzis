import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_email_delivery():
    email = input("Enter recipient email (use your MailerSend account email for test domain): ")
    
    sender_email = os.getenv("FROM_EMAIL")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_host = "smtp.mailersend.net"
    smtp_port = 587

    print("\n--- Diagnostic Start ---")
    print(f"Sender: {sender_email}")
    print(f"SMTP User: {smtp_user}")
    print(f"Recipient: {email}")
    print("------------------------\n")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Test Email - Game Store Zarzis"
    msg["From"] = f"Game Store <{sender_email}>"
    msg["To"] = email

    text = "If you see this, your SMTP settings are CORRECT!"
    html = f"<html><body><h1 style='color: green;'>Success!</h1><p>{text}</p></body></html>"

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        print("Connecting to MailerSend SMTP...")
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            print("Logging in...")
            server.login(smtp_user, smtp_pass)
            print("Sending email...")
            server.sendmail(sender_email, email, msg.as_string())
        print("\n✅ SUCCESS! The email was accepted by MailerSend.")
        print("If you don't see it in your inbox, check SPAM or MailerSend Approval status.")
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        print("\nCommon fixes:")
        print("1. Ensure password matches exactly (no secret spaces)")
        print("2. Ensure Sender Email matches the domain in MailerSend")
        print("3. Check if your MailerSend account is blocked or needs approval")

if __name__ == "__main__":
    test_email_delivery()
