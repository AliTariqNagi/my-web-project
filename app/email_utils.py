import os
from email.message import EmailMessage
import aiosmtplib
from dotenv import load_dotenv

load_dotenv()
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "hello@flowtica.ai")
NOTIFY_TO = os.getenv("NOTIFY_TO", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


def email_enabled() -> bool:
    return bool(SMTP_HOST and SMTP_FROM and NOTIFY_TO)


async def send_business_notification(
    subject: str,
    reply_to: str,
    body: str,
):
    """
    Email helper used by contact and booking routes.
    If SMTP variables are not configured, it silently skips email.
    The database still saves the lead.
    """
    if not email_enabled():
        return

    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = NOTIFY_TO
    msg["Reply-To"] = reply_to
    msg["Subject"] = subject
    msg.set_content(body)

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USERNAME or None,
        password=SMTP_PASSWORD or None,
        start_tls=SMTP_USE_TLS,
    )
