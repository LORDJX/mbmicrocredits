from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from api.utils.supabase import get_supabase_client
from supabase import Client

router = APIRouter()

# Importamos la dependencia de admin que ya creamos
from .users import is_request_admin

# Modelos Pydantic para la validación de datos de seguimientos
class FollowUpBase(BaseModel):
    client_id: UUID
    date: date = Field(..., description="Fecha del seguimiento")
    notes: Optional[str] = None
    reminder_date: Optional[date] = None

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpUpdate(BaseModel):
    client_id: Optional[UUID] = None
    date: Optional[date] = None
    notes: Optional[str] = None
    reminder_date: Optional[date] = None

class FollowUpResponse(FollowUpBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

@router.get("/", response_model=List[FollowUpResponse], summary="Obtener todos los seguimientos")
async def get_all_follow_ups(db_client: Client = Depends(get_db_client)):
    """
    Recupera una lista de todos los seguimientos.
    Las políticas de RLS en Supabase controlarán el acceso.
    """
    try:
        response = db_client.from_("follow_ups").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener seguimientos: {e}")

@router.get("/{follow_up_id}", response_model=FollowUpResponse, summary="Obtener un seguimiento por ID")
async def get_follow_up_by_id(follow_up_id: UUID, db_client: Client = Depends(get_db_client)):
    """
    Recupera un seguimiento específico por su ID.
    """
    try:
        response = db_client.from_("follow_ups").select("*").eq("id", str(follow_up_id)).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seguimiento no encontrado.")
        return response.data
    except Exception as e:
        if "PGRST" in str(e) and "406" in str(e): # Supabase returns 406 if single() finds no data
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seguimiento no encontrado.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener seguimiento: {e}")

@router.post("/", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo seguimiento (solo administradores)")
async def create_follow_up(follow_up_data: FollowUpCreate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Crea un nuevo seguimiento para un cliente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para crear seguimientos.")
    try:
        response = db_client.from_("follow_ups").insert(follow_up_data.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear seguimiento: No se recibieron datos de vuelta.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear seguimiento: {e}")

@router.patch("/{follow_up_id}", response_model=FollowUpResponse, summary="Actualizar un seguimiento (solo administradores)")
async def update_follow_up(follow_up_id: UUID, follow_up_data: FollowUpUpdate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Actualiza la información de un seguimiento existente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para actualizar seguimientos.")
    
    update_payload = follow_up_data.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar.")

    try:
        response = db_client.from_("follow_ups").update(update_payload).eq("id", str(follow_up_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seguimiento no encontrado para actualizar.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar seguimiento: {e}")

@router.delete("/{follow_up_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar un seguimiento (solo administradores)")
async def delete_follow_up(follow_up_id: UUID, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Elimina un seguimiento. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para eliminar seguimientos.")
    try:
        response = db_client.from_("follow_ups").delete().eq("id", str(follow_up_id)).execute()
        if not response.data: # Supabase returns empty data for successful delete
            # Check if the row actually existed before attempting to delete
            check_response = db_client.from_("follow_ups").select("id").eq("id", str(follow_up_id)).execute()
            if not check_response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seguimiento no encontrado para eliminar.")
        return # No content for 204
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al eliminar seguimiento: {e}")
