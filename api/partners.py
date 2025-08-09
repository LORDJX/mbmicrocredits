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

# Modelos Pydantic para la validación de datos de socios
class PartnerBase(BaseModel):
    name: str
    capital: float = Field(..., gt=0, description="El capital inicial debe ser mayor que 0")

class PartnerCreate(PartnerBase):
    pass # No hay campos adicionales para la creación por ahora

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    capital: Optional[float] = Field(None, gt=0, description="El capital debe ser mayor que 0 si se proporciona")
    withdrawals: Optional[float] = Field(None, ge=0, description="Los retiros no pueden ser negativos")
    generated_interest: Optional[float] = Field(None, ge=0, description="Los intereses generados no pueden ser negativos")
    deleted_at: Optional[datetime] = None # Para soft delete

class PartnerResponse(PartnerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    withdrawals: float
    generated_interest: float

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

@router.get("/", response_model=List[PartnerResponse], summary="Obtener todos los socios (activos por defecto, todos si es admin)")
async def get_all_partners(db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Recupera una lista de todos los socios.
    Los usuarios no administradores solo verán socios 'activos' (deleted_at es NULL)
    debido a las políticas de RLS. Los administradores verán todos los socios.
    """
    try:
        # La política de RLS en Supabase ya filtra por deleted_at IS NULL para no-admins
        # y permite ver todos a los admins.
        response = db_client.from_("partners").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener socios: {e}")

@router.get("/{partner_id}", response_model=PartnerResponse, summary="Obtener un socio por ID")
async def get_partner_by_id(partner_id: UUID, db_client: Client = Depends(get_db_client)):
    """
    Recupera un socio específico por su ID.
    """
    try:
        response = db_client.from_("partners").select("*").eq("id", str(partner_id)).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado.")
        return response.data
    except Exception as e:
        if "PGRST" in str(e) and "406" in str(e): # Supabase returns 406 if single() finds no data
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener socio: {e}")

@router.post("/", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo socio (solo administradores)")
async def create_partner(partner_data: PartnerCreate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Crea un nuevo socio. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para crear socios.")
    try:
        response = db_client.from_("partners").insert(partner_data.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear socio: No se recibieron datos de vuelta.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear socio: {e}")

@router.patch("/{partner_id}", response_model=PartnerResponse, summary="Actualizar un socio (solo administradores)")
async def update_partner(partner_id: UUID, partner_data: PartnerUpdate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Actualiza la información de un socio existente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para actualizar socios.")
    
    update_payload = partner_data.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar.")

    try:
        response = db_client.from_("partners").update(update_payload).eq("id", str(partner_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado para actualizar.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar socio: {e}")

@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar (soft delete) un socio (solo administradores)")
async def delete_partner(partner_id: UUID, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Realiza un 'soft delete' de un socio, marcándolo como eliminado. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para eliminar socios.")
    try:
        # Actualizamos la columna deleted_at a la fecha y hora actual
        response = db_client.from_("partners").update({"deleted_at": datetime.now().isoformat()}).eq("id", str(partner_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Socio no encontrado para eliminar.")
        return # No content for 204
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al eliminar socio: {e}")
