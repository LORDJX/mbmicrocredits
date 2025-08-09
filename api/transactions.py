from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from api.utils.supabase import get_supabase_client
from supabase import Client

router = APIRouter()

# Importamos la dependencia de admin que ya creamos
from .users import is_request_admin

# Modelos Pydantic para la validación de datos de transacciones
class TransactionBase(BaseModel):
    type: str = Field(..., pattern="^(income|expense)$", description="Tipo de transacción: 'income' (ingreso) o 'expense' (egreso)")
    amount: float = Field(..., gt=0, description="El monto de la transacción debe ser mayor que 0")
    description: Optional[str] = None
    partner_id: Optional[UUID] = None # Opcional, si la transacción está ligada a un socio

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(income|expense)$", description="Tipo de transacción: 'income' (ingreso) o 'expense' (egreso)")
    amount: Optional[float] = Field(None, gt=0, description="El monto de la transacción debe ser mayor que 0 si se proporciona")
    description: Optional[str] = None
    partner_id: Optional[UUID] = None

class TransactionResponse(TransactionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

@router.get("/", response_model=List[TransactionResponse], summary="Obtener todas las transacciones")
async def get_all_transactions(db_client: Client = Depends(get_db_client)):
    """
    Recupera una lista de todas las transacciones.
    Las políticas de RLS en Supabase controlarán el acceso.
    """
    try:
        response = db_client.from_("transactions").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener transacciones: {e}")

@router.get("/{transaction_id}", response_model=TransactionResponse, summary="Obtener una transacción por ID")
async def get_transaction_by_id(transaction_id: UUID, db_client: Client = Depends(get_db_client)):
    """
    Recupera una transacción específica por su ID.
    """
    try:
        response = db_client.from_("transactions").select("*").eq("id", str(transaction_id)).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada.")
        return response.data
    except Exception as e:
        if "PGRST" in str(e) and "406" in str(e): # Supabase returns 406 if single() finds no data
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener transacción: {e}")

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED, summary="Crear una nueva transacción (solo administradores)")
async def create_transaction(transaction_data: TransactionCreate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Crea una nueva transacción (ingreso o egreso). Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para crear transacciones.")
    try:
        response = db_client.from_("transactions").insert(transaction_data.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear transacción: No se recibieron datos de vuelta.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear transacción: {e}")

@router.patch("/{transaction_id}", response_model=TransactionResponse, summary="Actualizar una transacción (solo administradores)")
async def update_transaction(transaction_id: UUID, transaction_data: TransactionUpdate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Actualiza la información de una transacción existente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para actualizar transacciones.")
    
    update_payload = transaction_data.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar.")

    try:
        response = db_client.from_("transactions").update(update_payload).eq("id", str(transaction_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada para actualizar.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar transacción: {e}")

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar una transacción (solo administradores)")
async def delete_transaction(transaction_id: UUID, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Elimina una transacción. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para eliminar transacciones.")
    try:
        response = db_client.from_("transactions").delete().eq("id", str(transaction_id)).execute()
        if not response.data: # Supabase returns empty data for successful delete
            # Check if the row actually existed before attempting to delete
            check_response = db_client.from_("transactions").select("id").eq("id", str(transaction_id)).execute()
            if not check_response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada para eliminar.")
        return # No content for 204
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al eliminar transacción: {e}")
