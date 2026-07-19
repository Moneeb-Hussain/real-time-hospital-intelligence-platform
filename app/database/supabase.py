import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

# ⚡ FORCE CLEAN: Agar URL ke end mein '/rest/v1/' ya '/' ho toh usko remove karein
if "/rest/v1" in url:
    url = url.split("/rest/v1")[0]
url = url.strip().rstrip('/')

# Debugging ke liye terminal par print karwa ke check karte hain ke actual URL kya ja rahi hai
print(f"--- CONNECTING TO SUPABASE AT: {url} ---")

supabase: Client = create_client(url, key)