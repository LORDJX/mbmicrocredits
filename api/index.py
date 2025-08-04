from fastapi import FastAPI
import os
from dotenv import load_dotenv
from . import users
from . import partners
from . import clients
from . import loans
from . import transactions
from . import followups # Importamos el nuevo módulo de seguimientos

# Cargar variables de entorno desde .env para desarrollo local
# En Vercel, las variables de entorno se inyectan automáticamente
load_dotenv()

app = FastAPI()
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(partners.router, prefix="/api/partners", tags=["partners"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(followups.router, prefix="/api/followups", tags=["followups"]) # Incluimos el router de seguimientos

@app.get("/api/health")
async def health_check():
    """
    Endpoint para verificar el estado de la API.
    """
    return {"status": "ok", "message": "API de Microcréditos funcionando"}

# Puedes acceder a las variables de entorno de Supabase aquí
# SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
# SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Asegúrate de que SUPABASE_SERVICE_ROLE_KEY solo se use en el backend.
