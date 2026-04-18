try:
    from mailersend import MailerSend
    print("Success: from mailersend import MailerSend")
except ImportError as e:
    print(f"Fail: {e}")

try:
    from mailersend.client import MailerSend
    print("Success: from mailersend.client import MailerSend")
except ImportError as e:
    print(f"Fail: {e}")

try:
    from mailersend.emails import EmailParams
    print("Success: from mailersend.emails import EmailParams")
except ImportError as e:
    print(f"Fail: {e}")

try:
    from mailersend.params import EmailParams
    print("Success: from mailersend.params import EmailParams")
except ImportError as e:
    print(f"Fail: {e}")

import pkg_resources
dist = pkg_resources.get_distribution('mailersend')
print(f"Version: {dist.version}")
