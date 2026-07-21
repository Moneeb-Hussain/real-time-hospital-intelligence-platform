import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)

print("="*60)
print("🏥 SUPABASE SCHEMA VERIFICATION")
print("="*60)

# 1. Check all tables
print("\n📊 1. Checking Tables:")

tables = ['resources', 'patients', 'recommendations', 'queue', 'audit_logs', 'alerts']
table_status = {}

for table in tables:
    try:
        response = supabase.table(table).select('*').limit(1).execute()
        table_status[table] = True
        print(f"   ✅ {table} - Exists")
    except Exception as e:
        table_status[table] = False
        print(f"   ❌ {table} - Missing")

# 2. Check resources table schema
print("\n📋 2. Resources Table Schema:")
try:
    response = supabase.table('resources').select('*').limit(1).execute()
    if response.data:
        columns = list(response.data[0].keys())
        print(f"   Columns ({len(columns)}):")
        for col in columns:
            print(f"      - {col}")
    else:
        print("   ⚠️ No data found, but table exists")
except Exception as e:
    print(f"   ❌ Error: {e}")

# 3. Check patients table schema
print("\n📋 3. Patients Table Schema:")
try:
    response = supabase.table('patients').select('*').limit(1).execute()
    if response.data:
        columns = list(response.data[0].keys())
        print(f"   Columns ({len(columns)}):")
        required_columns = ['name', 'age', 'arrivaltype', 'complaint', 'symptoms', 'consciousness', 'vitals', 'urgency_score', 'priority_level', 'status']
        for col in required_columns:
            status = "✅" if col in columns else "❌"
            print(f"      {status} {col}")
    else:
        print("   ⚠️ No data found, but table exists")
except Exception as e:
    print(f"   ❌ Error: {e}")

# 4. Check recommendations table
print("\n📋 4. Recommendations Table Schema:")
try:
    response = supabase.table('recommendations').select('*').limit(1).execute()
    if response.data:
        columns = list(response.data[0].keys())
        print(f"   Columns ({len(columns)}):")
        for col in columns:
            print(f"      - {col}")
    else:
        print("   ⚠️ No data found, but table exists")
except Exception as e:
    print(f"   ❌ Error: {e}")

# 5. Check resource counts
print("\n📊 5. Resource Counts:")
try:
    response = supabase.table('resources').select('*').execute()
    resources = response.data if response.data else []
    
    beds = [r for r in resources if r.get('resource_type') == 'bed']
    doctors = [r for r in resources if r.get('resource_type') == 'doctor']
    equipment = [r for r in resources if r.get('resource_type') == 'equipment']
    
    print(f"   🏥 Beds: {len(beds)}")
    print(f"   👨‍⚕️ Doctors: {len(doctors)}")
    print(f"   🩺 Equipment: {len(equipment)}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# 6. Check patient counts
print("\n👤 6. Patient Counts:")
try:
    response = supabase.table('patients').select('*').execute()
    patients = response.data if response.data else []
    print(f"   Total Patients: {len(patients)}")
    
    # Count by priority
    if patients:
        p1 = len([p for p in patients if p.get('priority_level') == 'P1'])
        p2 = len([p for p in patients if p.get('priority_level') == 'P2'])
        p3 = len([p for p in patients if p.get('priority_level') == 'P3'])
        p4 = len([p for p in patients if p.get('priority_level') == 'P4'])
        print(f"   P1: {p1} | P2: {p2} | P3: {p3} | P4: {p4}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Summary
print("\n" + "="*60)
print("📊 SCHEMA SUMMARY")
print("="*60)

all_tables_exist = all(table_status.values())
if all_tables_exist:
    print("✅ All required tables exist!")
else:
    missing = [t for t, s in table_status.items() if not s]
    print(f"⚠️ Missing tables: {', '.join(missing)}")

print("="*60)
print("✅ Schema check complete!")