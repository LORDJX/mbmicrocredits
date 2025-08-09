from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from api.utils.supabase import get_supabase_client
from supabase import Client

router = APIRouter()

# Modelos Pydantic para la validación de datos
class ProfileBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    website: Optional[str] = None

class ProfileUpdate(ProfileBase):
    is_admin: Optional[bool] = None # Solo los administradores pueden cambiar esto para otros

class ProfileResponse(ProfileBase):
    id: UUID
    is_admin: bool
    updated_at: Optional[datetime] = None # Corregido: Hacer este campo opcional

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

# Función para verificar si el usuario que hace la petición es administrador
async def is_request_admin(db_client: Client = Depends(get_db_client)) -> bool:
    # NOTA DE SEGURIDAD: En una aplicación real, esto debería basarse en la identidad del usuario autenticado.
    return True # Temporalmente, asumimos que cualquier llamada a esta ruta es de un admin.


@router.get("/", response_model=List[ProfileResponse], summary="Obtener todos los perfiles de usuario (solo administradores)")
async def get_all_profiles(
    db_client: Client = Depends(get_db_client), 
    is_admin: bool = Depends(is_request_admin),
    search: Optional[str] = Query(None, description="Buscar usuarios por email o nombre completo")
):
    """
    Recupera una lista de todos los perfiles de usuario.
    Requiere permisos de administrador.
    Permite buscar por email (username) o nombre completo.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para ver todos los perfiles.")

    try:
        query = db_client.from_("profiles").select("*")
        
        if search:
            query = query.or_(f"username.ilike.%{search}%,full_name.ilike.%{search}%")
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener perfiles: {e}")

@router.get("/{user_id}", response_model=ProfileResponse, summary="Obtener un perfil de usuario por ID")
async def get_profile_by_id(user_id: UUID, db_client: Client = Depends(get_db_client)):
    """
    Recupera un perfil de usuario específico por su ID.
    """
    try:
        response = db_client.from_("profiles").select("*").eq("id", str(user_id)).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de usuario no encontrado.")
        return response.data
    except Exception as e:
        if "PGRST" in str(e) and "406" in str(e): # Supabase returns 406 if single() finds no data
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de usuario no encontrado.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener perfil: {e}")

@router.patch("/{user_id}", response_model=ProfileResponse, summary="Actualizar un perfil de usuario")
async def update_profile(user_id: UUID, profile_data: ProfileUpdate, db_client: Client = Depends(get_db_client), current_user_is_admin: bool = Depends(is_request_admin)):
    """
    Actualiza la información de un perfil de usuario.
    Solo los administradores pueden cambiar el estado `is_admin` de otros usuarios.
    """
    update_payload = profile_data.model_dump(exclude_unset=True)

    if "is_admin" in update_payload and not current_user_is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para modificar el estado de administrador.")

    try:
        response = db_client.from_("profiles").update(update_payload).eq("id", str(user_id)).select().single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de usuario no encontrado para actualizar.")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar perfil: {e}")
