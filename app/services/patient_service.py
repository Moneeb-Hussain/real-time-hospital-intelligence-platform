from app.database.supabase import supabase

def save_patient(data):
    response = supabase.table("patients").insert(data).execute()
    return response