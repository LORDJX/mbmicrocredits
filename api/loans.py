from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from api.utils.supabase import get_supabase_client
from supabase import Client

router = APIRouter()

# Importamos la dependencia de admin que ya creamos
from .users import is_request_admin

# Modelos Pydantic para la validación de datos de préstamos
class LoanBase(BaseModel):
    client_id: UUID
    amount: float = Field(..., gt=0, description="El monto del préstamo debe ser mayor que 0")
    installments: int = Field(..., gt=0, description="El número de cuotas debe ser mayor que 0")
    loan_type: Optional[str] = None
    interest_rate: Optional[float] = Field(None, ge=0, description="La tasa de interés no puede ser negativa")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None # Ej. 'activo', 'pagado', 'vencido'

class LoanCreate(LoanBase):
    # loan_code se genera automáticamente en la base de datos
    pass

class LoanUpdate(BaseModel):
    client_id: Optional[UUID] = None
    amount: Optional[float] = Field(None, gt=0, description="El monto del préstamo debe ser mayor que 0 si se proporciona")
    installments: Optional[int] = Field(None, gt=0, description="El número de cuotas debe ser mayor que 0 si se proporciona")
    loan_type: Optional[str] = None
    interest_rate: Optional[float] = Field(None, ge=0, description="La tasa de interés no puede ser negativa si se proporciona")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    deleted_at: Optional[datetime] = None # Para soft delete

class LoanResponse(LoanBase):
    id: UUID
    loan_code: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

@router.get("/", response_model=List[LoanResponse], summary="Obtener todos los préstamos (activos por defecto, todos si es admin)")
async def get_all_loans(search: Optional[str] = Query(None, description="Buscar préstamos por Código de Préstamo o ID de Cliente"), db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Recupera una lista de todos los préstamos.
    Los usuarios no administradores solo verán préstamos 'activos' (deleted_at es NULL)
    debido a las políticas de RLS. Los administradores verán todos los préstamos.
    """
    try:
        query = db_client.from_("loans").select("*")
        if search:
            # Búsqueda por loan_code o client_id
            query = query.or_(
                f"loan_code.ilike.%{search}%,client_id.ilike.%{search}%"
            )
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener préstamos: {e}")

@router.get("/{loan_id}", response_model=LoanResponse, summary="Obtener un préstamo por ID")
async def get_loan_by_id(loan_id: UUID, db_client: Client = Depends(get_db_client)):
    """
    Recupera un préstamo específico por su ID.
    """
    try:
        response = db_client.from_("loans").select("*").eq("id", str(loan_id)).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Préstamo no encontrado.")
        return response.data
    except Exception as e:
        if "PGRST" in str(e) and "406" in str(e): # Supabase returns 406 if single() finds no data
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Préstamo no encontrado.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener préstamo: {e}")

@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo préstamo (solo administradores)")
async def create_loan(loan_data: LoanCreate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Crea un nuevo préstamo. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para crear préstamos.")
    try:
        # loan_code se genera automáticamente en la base de datos
        response = db_client.from_("loans").insert(loan_data.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear préstamo: No se recibieron datos de vuelta.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear préstamo: {e}")

@router.patch("/{loan_id}", response_model=LoanResponse, summary="Actualizar un préstamo (solo administradores)")
async def update_loan(loan_id: UUID, loan_data: LoanUpdate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Actualiza la información de un préstamo existente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para actualizar préstamos.")
    
    update_payload = loan_data.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar.")

    try:
        response = db_client.from_("loans").update(update_payload).eq("id", str(loan_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Préstamo no encontrado para actualizar.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar préstamo: {e}")

@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar (soft delete) un préstamo (solo administradores)")
async def delete_loan(loan_id: UUID, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Realiza un 'soft delete' de un préstamo, marcándolo como eliminado. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para eliminar préstamos.")
    try:
        # Actualizamos la columna deleted_at a la fecha y hora actual
        response = db_client.from_("loans").update({"deleted_at": datetime.now().isoformat()}).eq("id", str(loan_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Préstamo no encontrado para eliminar.")
        return # No content for 204
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al eliminar préstamo: {e}")
