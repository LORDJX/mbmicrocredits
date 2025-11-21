# 🔧 GUÍA DE CONFIGURACIÓN - MB MICROCRÉDITOS

## ⚠️ ERROR ACTUAL

Si ves el error: **"Your project's URL and Key are required to create a Supabase client!"**

Esto significa que necesitas configurar las variables de entorno de Supabase.

---

## 📋 PASOS PARA CONFIGURAR

### 1. Obtener Credenciales de Supabase

1. Ve a tu proyecto en Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/TU_PROYECTO/settings/api
   ```

2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://abcdefghijk.supabase.co`)
   - **anon/public key** (empieza con `eyJ...`)
   - **service_role key** (solo para operaciones server-side)

---

### 2. Configurar Variables de Entorno

#### Opción A: Editar `.env.local` (RECOMENDADO)

Ya creamos el archivo `.env.local` en la raíz del proyecto.

**Edita el archivo y reemplaza estos valores:**

```bash
# Reemplaza con tu URL real de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Reemplaza con tu clave anon real
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu_clave_real_aqui...

# Reemplaza con tu service role key (opcional)
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_service_role_key...
```

#### Opción B: Usar Variables de Entorno del Sistema

Si estás en producción (Vercel, etc.), configura estas variables en tu plataforma:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

### 3. Verificar Configuración

Después de configurar las variables:

```bash
# Reinicia el servidor de desarrollo
# Ctrl+C para detener
# Luego ejecuta de nuevo:
npm run dev
# o
pnpm dev
```

---

## ✅ VERIFICACIÓN RÁPIDA

Puedes verificar que las variables están configuradas ejecutando:

```bash
node -e "console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ No configurada')"
```

---

## 🔒 SEGURIDAD

### ⚠️ IMPORTANTE: NO COMMITEAR CREDENCIALES

El archivo `.env.local` está en `.gitignore` por defecto.

**NUNCA commitees:**
- `.env.local`
- `.env`
- Archivos con credenciales reales

**SÍ puedes commitear:**
- `.env.example` (con valores de placeholder)

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
mbmicrocredits/
├── .env.local          # ✅ Tus credenciales (NO COMMITEAR)
├── .env.example        # ✅ Template (OK COMMITEAR)
├── .gitignore          # ✅ Ignora .env*
└── ...
```

---

## 🚀 SIGUIENTE PASO

Una vez configuradas las variables de entorno:

1. ✅ Reinicia el servidor
2. ✅ Navega a `http://localhost:3000`
3. ✅ Prueba el login
4. ✅ Prueba el logout

---

## ❓ PROBLEMAS COMUNES

### Error: "Invalid URL"
- **Causa:** La URL de Supabase no es válida
- **Solución:** Verifica que la URL esté completa: `https://xxxxx.supabase.co`

### Error: "Invalid API key"
- **Causa:** La clave anon es incorrecta
- **Solución:** Copia nuevamente desde Supabase Dashboard

### Error persiste después de configurar
- **Causa:** El servidor no recargó las variables
- **Solución:** Detén completamente el servidor (Ctrl+C) y reinicia

---

## 📞 SOPORTE

Si necesitas ayuda:

1. Verifica que copiaste las credenciales correctamente
2. Asegúrate de que tu proyecto Supabase esté activo
3. Revisa la documentación de Supabase: https://supabase.com/docs

---

**Última actualización:** 2025-11-21
