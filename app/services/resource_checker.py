from app.database.supabase import supabase

async def check_available_resources():
    """Check all available resources in the hospital"""
    try:
        # Get all resources
        response = supabase.table('resources').select('*').execute()
        resources = response.data if response.data else []
        
        # Filter by type
        beds = [r for r in resources if r.get('resource_type') == 'bed']
        doctors = [r for r in resources if r.get('resource_type') == 'doctor']
        equipment = [r for r in resources if r.get('resource_type') == 'equipment']
        
        # Count available
        available_beds = [b for b in beds if b.get('is_available') == True]
        available_doctors = [d for d in doctors if d.get('is_available') == True]
        available_equipment = [e for e in equipment if e.get('is_available') == True]
        
        # ICU and Emergency beds
        icu_beds = [b for b in beds if b.get('sub_type') == 'ICU' and b.get('is_available') == True]
        emergency_beds = [b for b in beds if b.get('sub_type') == 'emergency' and b.get('is_available') == True]
        
        return {
            'icu_beds': len(icu_beds),
            'emergency_beds': len(emergency_beds),
            'available_doctors': len(available_doctors),
            'available_equipment': len(available_equipment),
            'total_beds': len(beds),
            'total_doctors': len(doctors),
            'total_equipment': len(equipment)
        }
        
    except Exception as e:
        print(f"Error checking resources: {e}")
        return {
            'icu_beds': 0,
            'emergency_beds': 0,
            'available_doctors': 0,
            'available_equipment': 0,
            'total_beds': 0,
            'total_doctors': 0,
            'total_equipment': 0
        }