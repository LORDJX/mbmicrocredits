from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from api.utils.supabase import get_supabase_client
from supabase import Client

router = APIRouter()

# Importamos la dependencia de admin que ya creamos
from .users import is_request_admin

# Modelos Pydantic para la validación de datos de clientes
class ClientBase(BaseModel):
    last_name: str
    first_name: str
    dni: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    referred_by: Optional[str] = None
    status: Optional[str] = None
    observations: Optional[str] = None
    dni_photo_url: Optional[str] = None # URL de la foto del DNI en Supabase Storage

class ClientCreate(ClientBase):
    # client_code se genera automáticamente en la base de datos
    pass

class ClientUpdate(BaseModel):
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    dni: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    referred_by: Optional[str] = None
    status: Optional[str] = None
    observations: Optional[str] = None
    dni_photo_url: Optional[str] = None
    deleted_at: Optional[datetime] = None # Para soft delete

class ClientResponse(ClientBase):
    id: UUID
    client_code: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Permite la asignación desde atributos de objeto (como los de Supabase)

# Dependencia para obtener el cliente Supabase
def get_db_client() -> Client:
    return get_supabase_client()

@router.get("/", response_model=List[ClientResponse], summary="Obtener todos los clientes (activos por defecto, todos si es admin)")
async def get_all_clients(
    db_client: Client = Depends(get_db_client),
    is_admin: bool = Depends(is_request_admin),
    search: Optional[str] = Query(None, description="Buscar clientes por Apellido, Nombre o DNI")
):
    """
    Recupera una lista de todos los clientes.
    Los usuarios no administradores solo verán clientes 'activos' (deleted_at es NULL)
    debido a las políticas de RLS. Los administradores verán todos los clientes.
    Permite buscar por 'Apellido, Nombre' o DNI.
    """
    try:
        query = db_client.from_("clients").select("*")

        if search:
            # Búsqueda por Apellido, Nombre o DNI
            # Usamos ilike para búsqueda insensible a mayúsculas/minúsculas
            # y combinamos con or para buscar en múltiples campos
            query = query.or_(
                f"last_name.ilike.%{search}%,first_name.ilike.%{search}%,dni.ilike.%{search}%"
            )

        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener clientes: {e}")

@router.get("/{client_id}", response_model=ClientResponse, summary="Obtener un cliente por ID")
async def get_client_by_id(client_id: UUID, db_client: Client = Depends(get_db_client)):
    """
    Recupera un cliente específico por su ID.
    """
    try:
        response = db_client.from_("clients").select("*").eq("id", str(client_id)).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")
        return response.data
    except Exception as e:
        if "PGRST" in str(e) and "406" in str(e): # Supabase returns 406 if single() finds no data
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al obtener cliente: {e}")

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo cliente (solo administradores)")
async def create_client(client_data: ClientCreate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Crea un nuevo cliente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para crear clientes.")
    try:
        # client_code se genera automáticamente en la base de datos
        response = db_client.from_("clients").insert(client_data.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear cliente: No se recibieron datos de vuelta.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear cliente: {e}")

@router.patch("/{client_id}", response_model=ClientResponse, summary="Actualizar un cliente (solo administradores)")
async def update_client(client_id: UUID, client_data: ClientUpdate, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Actualiza la información de un cliente existente. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para actualizar clientes.")
    
    update_payload = client_data.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar.")

    try:
        response = db_client.from_("clients").update(update_payload).eq("id", str(client_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para actualizar.")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar cliente: {e}")

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar (soft delete) un cliente (solo administradores)")
async def delete_client(client_id: UUID, db_client: Client = Depends(get_db_client), is_admin: bool = Depends(is_request_admin)):
    """
    Realiza un 'soft delete' de un cliente, marcándolo como eliminado. Requiere permisos de administrador.
    """
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos de administrador para eliminar clientes.")
    try:
        # Actualizamos la columna deleted_at a la fecha y hora actual
        response = db_client.from_("clients").update({"deleted_at": datetime.now().isoformat()}).eq("id", str(client_id)).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado para eliminar.")
        return # No content for 204
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al eliminar cliente: {e}")
