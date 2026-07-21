import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL: {url}")
print(f"Key: {key[:20]}...")

try:
    supabase = create_client(url, key)
    response = supabase.table("resources").select("*").limit(1).execute()
    print("✅ Connected!")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"❌ Error: {e}")