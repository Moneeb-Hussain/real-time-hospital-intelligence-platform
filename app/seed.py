import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
def create_table_if_not_exists():
    """Create the resources table if it doesn't exist"""
    print("📋 Checking if resources table exists...")
    
    try:
        # Try to query the table
        supabase.table('resources').select('*').limit(1).execute()
        print("✅ Resources table already exists!")
        return True
    except Exception as e:
        if 'PGRST125' in str(e):
            print("⚠️ Resources table not found. Creating it...")
            try:
                # Create table using raw SQL (requires service_role key)
                # This is a workaround - better to create manually in Supabase
                print("   🔧 Please create the table manually in Supabase SQL Editor:")
                print("   " + "="*50)
                print("   CREATE TABLE IF NOT EXISTS resources (")
                print("       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),")
                print("       created_at TIMESTAMPTZ DEFAULT NOW(),")
                print("       resource_type TEXT NOT NULL CHECK (resource_type IN ('bed', 'doctor', 'equipment')),")
                print("       sub_type TEXT,")
                print("       name TEXT NOT NULL,")
                print("       is_available BOOLEAN DEFAULT TRUE,")
                print("       assigned_to UUID,")
                print("       workload INT DEFAULT 0,")
                print("       last_updated TIMESTAMPTZ DEFAULT NOW()")
                print("   );")
                print("   " + "="*50)
                print("   ❗ Please run this SQL in Supabase SQL Editor and try again.")
                return False
            except Exception as create_error:
                print(f"❌ Failed to create table: {create_error}")
                return False
        else:
            print(f"❌ Database error: {e}")
            return False
# Load environment variables
load_dotenv()

# Initialize Supabase
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(url, key)


def clear_resources():
    """Clear existing resources (optional)"""
    print("🧹 Clearing existing resources...")
    try:
        supabase.table('resources').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print("✅ Resources cleared!")
    except Exception as e:
        print(f"⚠️ Could not clear resources: {e}")


def seed_database():
    """Seed the database with hospital resources"""
    
    print("\n🌱 Starting Database Seeding...\n")
    
    # 1. Add ICU Beds
    print("🏥 Adding ICU Beds...")
    icu_beds = [
        {"resource_type": "bed", "sub_type": "ICU", "name": "ICU Bed #1", "is_available": True},
        {"resource_type": "bed", "sub_type": "ICU", "name": "ICU Bed #2", "is_available": True},
        {"resource_type": "bed", "sub_type": "ICU", "name": "ICU Bed #3", "is_available": True},
        {"resource_type": "bed", "sub_type": "ICU", "name": "ICU Bed #4", "is_available": True},
    ]
    
    for bed in icu_beds:
        try:
            supabase.table('resources').insert(bed).execute()
            print(f"   ✅ Added: {bed['name']}")
        except Exception as e:
            print(f"   ❌ Failed to add {bed['name']}: {e}")
    
    # 2. Add Emergency Beds
    print("\n🚑 Adding Emergency Beds...")
    er_beds = [
        {"resource_type": "bed", "sub_type": "emergency", "name": "ER Bed #1", "is_available": True},
        {"resource_type": "bed", "sub_type": "emergency", "name": "ER Bed #2", "is_available": True},
        {"resource_type": "bed", "sub_type": "emergency", "name": "ER Bed #3", "is_available": True},
        {"resource_type": "bed", "sub_type": "emergency", "name": "ER Bed #4", "is_available": True},
        {"resource_type": "bed", "sub_type": "emergency", "name": "ER Bed #5", "is_available": True},
    ]
    
    for bed in er_beds:
        try:
            supabase.table('resources').insert(bed).execute()
            print(f"   ✅ Added: {bed['name']}")
        except Exception as e:
            print(f"   ❌ Failed to add {bed['name']}: {e}")
    
    # 3. Add Doctors
    print("\n👨‍⚕️ Adding Doctors...")
    doctors = [
        {"resource_type": "doctor", "sub_type": "emergency", "name": "Dr. Sarah Johnson", "is_available": True, "workload": 2},
        {"resource_type": "doctor", "sub_type": "emergency", "name": "Dr. Mike Chen", "is_available": True, "workload": 1},
        {"resource_type": "doctor", "sub_type": "emergency", "name": "Dr. Emily Brown", "is_available": True, "workload": 0},
        {"resource_type": "doctor", "sub_type": "ICU", "name": "Dr. James Wilson", "is_available": True, "workload": 1},
        {"resource_type": "doctor", "sub_type": "ICU", "name": "Dr. Maria Garcia", "is_available": True, "workload": 0},
        {"resource_type": "doctor", "sub_type": "emergency", "name": "Dr. David Kim", "is_available": True, "workload": 3},
    ]
    
    for doctor in doctors:
        try:
            supabase.table('resources').insert(doctor).execute()
            print(f"   ✅ Added: {doctor['name']}")
        except Exception as e:
            print(f"   ❌ Failed to add {doctor['name']}: {e}")
    
    # 4. Add Equipment
    print("\n🩺 Adding Medical Equipment...")
    equipment = [
        {"resource_type": "equipment", "sub_type": "cardiac_monitor", "name": "Cardiac Monitor A", "is_available": True},
        {"resource_type": "equipment", "sub_type": "cardiac_monitor", "name": "Cardiac Monitor B", "is_available": True},
        {"resource_type": "equipment", "sub_type": "cardiac_monitor", "name": "Cardiac Monitor C", "is_available": True},
        {"resource_type": "equipment", "sub_type": "ventilator", "name": "Ventilator X", "is_available": True},
        {"resource_type": "equipment", "sub_type": "ventilator", "name": "Ventilator Y", "is_available": True},
        {"resource_type": "equipment", "sub_type": "defibrillator", "name": "Defibrillator Z", "is_available": True},
        {"resource_type": "equipment", "sub_type": "defibrillator", "name": "Defibrillator W", "is_available": True},
        {"resource_type": "equipment", "sub_type": "oxygen_tank", "name": "Oxygen Tank #1", "is_available": True},
        {"resource_type": "equipment", "sub_type": "oxygen_tank", "name": "Oxygen Tank #2", "is_available": True},
    ]
    
    for item in equipment:
        try:
            supabase.table('resources').insert(item).execute()
            print(f"   ✅ Added: {item['name']}")
        except Exception as e:
            print(f"   ❌ Failed to add {item['name']}: {e}")
    
    # 5. Add Hospital Info (optional)
    print("\n🏥 Adding Hospital Information...")
    try:
        # Check if hospital_info table exists, if not, create it
        hospital_data = {
            "name": "City General Hospital",
            "address": "123 Healthcare Blvd, Medical District",
            "phone": "+1 (555) 123-4567",
            "total_beds": 9,
            "total_doctors": 6,
            "departments": ["Emergency", "ICU", "Cardiology", "Neurology"]
        }
        # Uncomment if you have a hospital_info table
        # supabase.table('hospital_info').insert(hospital_data).execute()
        print(f"   ℹ️ Hospital Info: {hospital_data['name']}")
        print(f"      📍 {hospital_data['address']}")
        print(f"      📞 {hospital_data['phone']}")
    except Exception as e:
        print(f"   ⚠️ Hospital info not added: {e}")
    
    print("\n" + "="*50)
    print("🎉 Database Seeding Complete!")
    print("="*50)
    print("\n📊 Summary:")
    print(f"   🏥 ICU Beds: {len(icu_beds)}")
    print(f"   🚑 ER Beds: {len(er_beds)}")
    print(f"   👨‍⚕️ Doctors: {len(doctors)}")
    print(f"   🩺 Equipment: {len(equipment)}")


def verify_seeding():
    """Verify that data was seeded correctly"""
    print("\n🔍 Verifying Seeded Data...\n")
    
    try:
        # Check resources
        response = supabase.table('resources').select('*').execute()
        resources = response.data if response.data else []
        
        if resources:
            print(f"✅ Total resources in database: {len(resources)}")
            
            # Count by type
            beds = [r for r in resources if r.get('resource_type') == 'bed']
            doctors = [r for r in resources if r.get('resource_type') == 'doctor']
            equipment = [r for r in resources if r.get('resource_type') == 'equipment']
            
            print(f"   🏥 Beds: {len(beds)}")
            print(f"   👨‍⚕️ Doctors: {len(doctors)}")
            print(f"   🩺 Equipment: {len(equipment)}")
            
            # Show first few records
            print("\n📋 Sample Data:")
            for r in resources[:5]:
                print(f"   - {r.get('name')} ({r.get('resource_type')}) - Available: {r.get('is_available')}")
        else:
            print("❌ No resources found in database!")
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")


if __name__ == "__main__":
    print("\n" + "="*50)
    print("🏥 HOSPITAL INTELLIGENCE PLATFORM")
    print("📦 Database Seeder")
    print("="*50)

    # Non-interactive: pass --clear to wipe first, otherwise keep existing rows
    should_clear = "--clear" in sys.argv
    if should_clear:
        clear_resources()
    elif sys.stdin.isatty():
        choice = input("\n⚠️ Do you want to clear existing resources first? (y/n): ")
        if choice.lower() == "y":
            clear_resources()

    seed_database()
    verify_seeding()
    print("\n✅ Done! Your database is ready! 🚀")
