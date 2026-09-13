# 📩 Mensajes Anónimos (Cloudflare Pages + D1)

Aplicación web minimalista, ligera y moderna para recibir mensajes 100% anónimos. Interfaz estilo chat con estética monocromática (blanco y negro), ventana de confirmación previa al envío, y un panel de administración protegido para leer y gestionar los mensajes.

---

## 🚀 Guía de Puesta en Marcha

### Paso 1: Subir el proyecto a GitHub

1. Abre [GitHub](https://github.com) y crea un nuevo repositorio (por ejemplo, `mensajes-anonimos`). Déjalo vacío (sin README ni .gitignore porque este proyecto ya los incluye).
2. Abre tu terminal en esta carpeta y ejecuta los siguientes comandos:

```bash
git init
git add .
git commit -m "feat: interfaz minimalista de mensajes anónimos con D1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```
*(Reemplaza `TU_USUARIO` y `TU_REPOSITORIO` con los de tu cuenta de GitHub).*

---

### Paso 2: Crear la Base de Datos en Cloudflare D1

1. Inicia sesión en tu panel de [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. En el menú lateral izquierdo, ve a **Storage & Databases** > **D1 SQL Database**.
3. Haz clic en **Create** (Crear base de datos).
4. Elige un nombre para la base de datos, por ejemplo: `mensajes-db`, y haz clic en **Create**.
5. Dentro de tu nueva base de datos, haz clic en la pestaña **Console**.
6. Pega el código de `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

7. Haz clic en **Execute** para crear la tabla.

---

### Paso 3: Conectar y Desplegar en Cloudflare Pages

1. En el menú lateral de Cloudflare, ve a **Workers & Pages**.
2. Haz clic en **Create application** y selecciona la pestaña **Pages**.
3. Elige la opción **Connect to Git** y vincula tu cuenta de GitHub.
4. Selecciona el repositorio que creaste en el Paso 1.
5. En los ajustes de configuración de compilación (**Build settings**):
   - **Framework preset**: `None`
   - **Build command**: *(dejar vacío)*
   - **Build output directory**: *(dejar vacío o colocar `. `)*
6. Haz clic en **Save and Deploy**.

---

### Paso 4: Vincular la Base D1 y Definir la Contraseña de Administrador

Una vez creado el proyecto en Cloudflare Pages:

1. Ve a **Settings** (Configuración) de tu proyecto en Pages.
2. En el menú izquierdo, selecciona **Functions**.
3. Baja hasta la sección **D1 database bindings** y haz clic en **Add binding**:
   - **Variable name**: `DB` *(Debe ser exactamente en mayúsculas: `DB`)*
   - **D1 database**: Selecciona `mensajes-db` (la que creaste en el Paso 2).
   - Guarda los cambios.
4. En el menú izquierdo, selecciona **Environment variables** (Variables de entorno):
   - Haz clic en **Add variables**.
   - **Variable name**: `ADMIN_PASSWORD`
   - **Value**: Escribe la contraseña que quieras usar para ingresar a tu panel de administrador.
   - Guarda los cambios.
5. Ve a la pestaña **Deployments** (Despliegues), busca tu último despliegue, haz clic en los tres puntos `...` a la derecha y selecciona **Retry deployment** (o haz un nuevo commit en GitHub) para que Cloudflare aplique los bindings.

---

## 🔒 Rutas Disponibles

- **Página pública (`/` o `/index.html`)**:
  - Barra de texto tipo chat para que cualquier usuario envíe mensajes anónimos.
  - Cartel de confirmación antes de enviar.
  - Se reinicia el formulario tras cada envío.

- **Panel de administrador (`/admin.html`)**:
  - Solicita tu contraseña configurada en `ADMIN_PASSWORD`.
  - Muestra todos los mensajes recibidos ordenados cronológicamente con fecha y hora.
  - Permite eliminar mensajes individuales.
