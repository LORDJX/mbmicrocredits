"""
Utilidad singleton para crear el cliente de Supabase en Python.

- Paquete correcto en PyPI: 'supabase' (no 'supabase-py').
- Import oficial: from supabase import create_client, Client
- Variables de entorno esperadas:
    SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY (recomendado para backend) o SUPABASE_ANON_KEY

Uso:
    from api.utils.supabase import get_supabase
    supabase = get_supabase()
    resp = supabase.table("follow_ups").select("*").limit(1).execute()
"""

from __future__ import annotations

import os
from typing import Optional, Union

from supabase import Client, create_client  # paquete: 'supabase'

# Singleton en módulo
_SUPABASE_CLIENT: Optional[Client] = None


def _env(key: str, fallback: Union[str, None] = None) -> Optional[str]:
    val = os.getenv(key)
    if (not val) and fallback:
        val = os.getenv(fallback)
    return val


def get_supabase() -> Client:
    """
    Devuelve un cliente Supabase singleton.
    Lanza RuntimeError si faltan variables de entorno.
    """
    global _SUPABASE_CLIENT
    if _SUPABASE_CLIENT is not None:
        return _SUPABASE_CLIENT

    url = _env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    key = _env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY")

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
    Prueba rápida de inicialización de cliente (sin tocar red).
    Útil para logs durante el build/deploy.
    """
    try:
        _ = get_supabase()
        return {"ok": True, "details": "Cliente inicializado"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
