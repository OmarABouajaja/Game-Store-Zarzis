
import os
import sys
from dotenv import load_dotenv

# Load env vars
load_dotenv()

from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

supabase: Client = create_client(url, key)

print("Checking users matching 'quatg'...")

try:
    # List all users (limit 50)
    response = supabase.auth.admin.list_users()
    users = response.users
    
    found = []
    for user in users:
        if "quatg" in user.email:
            found.append(user.email)
            print(f"FOUND: {user.email} (ID: {user.id})")
            
    if not found:
        print("No users found matching 'quatg'")
        
except Exception as e:
    print(f"Error: {e}")
