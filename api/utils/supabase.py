import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """
    Inicializa y devuelve un cliente Supabase utilizando las variables de entorno.
    Utiliza la clave de rol de servicio para operaciones de backend que pueden
    requerir eludir RLS.
    """
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Usar la clave de rol de servicio

    if not supabase_url or not supabase_key:
        raise ValueError("Las variables de entorno de Supabase no están configuradas correctamente.")

    return create_client(supabase_url, supabase_key)
