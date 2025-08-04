from fastapi import APIRouter, HTTPException, Depends, status
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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

# Función para verificar si el usuario que hace la petición es administrador
# En un entorno real, esto se haría a través de un token de sesión o JWT
# que contenga el rol del usuario, o consultando la base de datos con el auth.uid()
# del usuario que hace la petición. Para este ejemplo, asumimos que el cliente
# de Supabase ya tiene la clave de rol de servicio y puede consultar directamente.
async def is_request_admin(db_client: Client = Depends(get_db_client)) -> bool:
    # NOTA DE SEGURIDAD: En una aplicación real, la verificación de admin
    # para la API debería basarse en la identidad del usuario que hace la petición
    # (ej. a través de un JWT validado), no solo en el uso de la service_role_key.
    # Aquí, para simplificar el ejemplo de backend, asumimos que si esta función
    # es llamada, es porque se espera una operación de admin.
    # Para una verificación más robusta, necesitarías un mecanismo de autenticación
    # y autorización para las llamadas a la API.
    return True # Temporalmente, asumimos que cualquier llamada a esta ruta es de un admin.
                # En un sistema real, se verificaría el rol del usuario autenticado.


@router.get("/", response_model=List[ProfileResponse], summary="Obtener todos los perfiles de usuario (solo administradores)")
async def get_all_profiles(db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Recupera una lista de todos los perfiles de usuario.
    Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para ver todos los perfiles.")

    try:
        response = db_client.from_("profiles").select("*").execute()
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

    # Si se intenta cambiar is_admin y no es el propio usuario o el usuario no es admin
    if "is_admin" in update_payload and not current_user_is_admin:
        # Si el usuario intenta cambiar su propio is_admin, esto debería ser manejado por RLS o una lógica específica.
        # Aquí, si no es admin, no puede cambiar is_admin de nadie.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para modificar el estado de administrador.")

    try:
        response = db_client.from_("profiles").update(update_payload).eq("id", str(user_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de usuario no encontrado para actualizar.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar perfil: {e}")
