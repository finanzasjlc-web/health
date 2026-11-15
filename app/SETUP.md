# Puesta en marcha de la app

Tres pasos, todos desde el navegador. Tiempo total: 10-15 minutos.

## 1. Base de datos (Supabase)

1. Entra en https://supabase.com/dashboard y abre el proyecto `rbaajuymsypmytwxbmri`.
2. Menú lateral **SQL Editor** > **New query**.
3. Copia el contenido completo de `app/supabase/schema.sql`, pégalo y pulsa **Run**.
   Debe terminar sin errores ("Success. No rows returned"). Se puede volver a ejecutar sin problema.
4. **Authentication** > **Sign In / Providers** > **Email**: deja activado "Enable email provider".
   Opcional para no tener que confirmar el email al crear la cuenta: desactiva **Confirm email**.
5. **Authentication** > **URL Configuration** > **Site URL**: pon la URL de GitHub Pages cuando la tengas
   (`https://<usuario>.github.io/<repo>/`). Añádela también en **Redirect URLs**.

## 2. Repositorio y despliegue (GitHub)

El repositorio local ya está inicializado y con el primer commit. La carpeta `deportistas/deportista-01/` está excluida por `.gitignore`: tus datos personales no se suben.

1. En https://github.com/new crea un repositorio **público** (GitHub Pages gratuito lo exige) llamado por ejemplo `health`. Sin README, sin .gitignore, sin licencia.
2. En esta carpeta ejecuta:
   ```powershell
   git remote add origin https://github.com/<usuario>/health.git
   git push -u origin main
   ```
3. En el repositorio: **Settings** > **Pages** > **Build and deployment** > Source: **GitHub Actions**.
4. Pestaña **Actions**: el flujo "Desplegar PWA en GitHub Pages" se ejecuta solo con el push. Al terminar, la URL aparece en Settings > Pages: `https://<usuario>.github.io/health/`.

Cada push a `main` que toque `app/web/` vuelve a desplegar.

## 3. Instalar en Android

1. Abre la URL de Pages en **Chrome** en el móvil.
2. Menú ⋮ > **Añadir a pantalla de inicio** (o "Instalar app").
3. Crea tu cuenta con email y contraseña. La ficha de deportista se crea sola.
4. Pestaña **Ajustes**: rellena nombre, altura, sexo, fecha de nacimiento y marca el consentimiento.

## Probar en local antes de desplegar

```powershell
py -m http.server 8765 --directory app\web
```
Abre http://127.0.0.1:8765 en Chrome. La app se conecta a la misma base de datos de Supabase.

## Cómo cargar el plan (lo hace el preparador)

- **Sesiones planificadas**: insertar filas en `sesion_planificada` (fecha, nombre, tipo, duración). Aparecen en la pestaña Hoy con botón "Registrar".
- **Objetivos nutricionales**: una fila en `plan_nutricional` con `objetivos_json`, por ejemplo:
  ```json
  {"fuerte":{"kcal":3000,"prot":180,"ch":400,"grasa":80},
   "ligero":{"kcal":2700,"prot":180,"ch":320,"grasa":85},
   "descanso":{"kcal":2500,"prot":180,"ch":260,"grasa":90}}
  ```
  Por ahora se insertan desde el SQL Editor o Table Editor de Supabase; en el siguiente sprint se añade una pantalla para ello.

## Varios deportistas

- Cada deportista crea su cuenta en la app y solo ve sus datos.
- Para que el preparador vea a un deportista: en la tabla `deportistas`, poner en `preparador_id` el `user_id` del preparador. En la app aparece entonces un selector arriba para cambiar de deportista.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No hay ficha de deportista" al entrar | El esquema SQL no estaba ejecutado cuando se creó la cuenta | Ejecutar el esquema; luego en Table Editor > deportistas insertar una fila con tu `user_id` (Authentication > Users) |
| Error al guardar: "row-level security" | Falta ejecutar el esquema o la ficha no es tuya | Ejecutar `schema.sql` de nuevo |
| La app no se actualiza tras un despliegue | Caché del service worker | Subir `CACHE_VERSION` en `sw.js` y `APP_VERSION` en `config.js`; o cerrar y abrir la app |
| No sale "Instalar app" | Falta HTTPS o manifest | Usar la URL de GitHub Pages, no `file://` |
