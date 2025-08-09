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

# Cambiamos los prefijos para evitar colisiones con los proxies de Next.js
app.include_router(users.router, prefix="/api/backend/users", tags=["users"])
app.include_router(partners.router, prefix="/api/backend/partners", tags=["partners"])
app.include_router(clients.router, prefix="/api/backend/clients", tags=["clients"])
app.include_router(loans.router, prefix="/api/backend/loans", tags=["loans"])
app.include_router(transactions.router, prefix="/api/backend/transactions", tags=["transactions"])
app.include_router(followups.router, prefix="/api/backend/followups", tags=["followups"])

@app.get("/api/health")
async def health_check():
    """
    Endpoint para verificar el estado de la API.
    """
    return {"status": "ok", "message": "API de Microcréditos funcionando"}
