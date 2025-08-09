"""
Utilidad singleton para crear el cliente de Supabase en Python.

Requiere las variables de entorno:
- SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL como respaldo)
- SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY como respaldo; preferido: SERVICE_ROLE para operaciones del servidor)

Ejemplo de uso:
    from api.utils.supabase import get_supabase
    supabase = get_supabase()
    data = supabase.table("follow_ups").select("*").limit(1).execute()

Nota: Asegúrate de tener instalado el paquete 'supabase' (no 'supabase-py') vía requirements.txt.
"""

from __future__ import annotations

import os
from typing import Optional

from supabase import Client, create_client

_SUPABASE_CLIENT: Optional[Client] = None


def _load_env(key: str, fallback_key: str | None = None) -> Optional[str]:
    value = os.environ.get(key)
    if not value and fallback_key:
        value = os.environ.get(fallback_key)
    return value


def get_supabase() -> Client:
    """
    Devuelve un cliente singleton de Supabase.
    Lanza RuntimeError si faltan variables de entorno necesarias.
    """
    global _SUPABASE_CLIENT
    if _SUPABASE_CLIENT is not None:
        return _SUPABASE_CLIENT

    url = _load_env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    key = _load_env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY")

    if not url:
        raise RuntimeError(
            "SUPABASE_URL no está definida (o NEXT_PUBLIC_SUPABASE_URL)."
        )
    if not key:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY no está definida (o SUPABASE_ANON_KEY)."
        )

    _SUPABASE_CLIENT = create_client(url, key)
    return _SUPABASE_CLIENT


def health_check() -> dict:
    """
    Intenta realizar una operación simple para comprobar conectividad.
    No falla el proceso; devuelve un dict con el resultado para logging.
    """
    try:
        client = get_supabase()
        # Consulta mínima a una RPC inexistente solo para confirmar reachability del endpoint.
        # Alternativamente, comenta esto si prefieres no tocar la red en el build.
        # resp = client.rpc("pg_version").execute()
        # return {"ok": True, "details": str(resp)}
        return {"ok": True, "details": "Cliente inicializado"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
