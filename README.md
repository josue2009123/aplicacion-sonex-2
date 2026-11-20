# Sonex — audífonos con IA integrada (web + app móvil)

Sitio web y **app móvil** de Sonex, la empresa que diseña y produce audífonos con
inteligencia artificial integrada. Hecho en Python con Flask + SQLite.

## 📱 La app móvil

El mismo servidor ahora es también una app instalable (PWA): en el celular se ve
y se usa como una app, con su ícono en la pantalla de inicio, pantalla completa
y barra de pestañas abajo (Inicio · Tienda · Carrito · Cuenta).

Qué cambió para que sea más fácil de usar:
- Barra de pestañas fija abajo, al alcance del pulgar, con el número de artículos del carrito.
- Tienda en 2 columnas con filtros (Todos / In-ear / Diademas), botón **+** para agregar y ♥ para favoritos sin salir de la página.
- Página de producto con foto grande y botón **Agregar al carrito** siempre visible.
- Carrito con botones **− / +** para cambiar cantidades y quitar productos, total que se actualiza solo.
- Avisos en pantalla (toasts) en vez de ventanas emergentes; vibración ligera al agregar.
- Entrar: la huella / rostro va primero; botón **Ver** para mostrar la contraseña; si agregas algo sin sesión, al entrar regresas a donde estabas.
- Cuenta ordenada: resumen (pedidos, favoritos, carrito), pedidos con nombres de producto, y ajustes plegables (perfil, huella, QR, instalar app, cerrar sesión). Si alguien pide entrar con QR, el aviso aparece arriba.
- Funciona sin internet para inicio, tienda y productos ya vistos; si no hay red muestra una pantalla de “Sin conexión”.
- En la computadora sigue viéndose como página web normal.

### Instalarla en el celular
La app se instala desde la dirección **https://** de Render (no desde el archivo):
- **Android (Chrome):** abre la página y toca **Instalar** en el aviso de arriba (o menú ⋮ → *Instalar app*).
- **iPhone (Safari):** toca **Compartir** ⬆️ → **Agregar a inicio**.

La huella / Face ID sigue funcionando dentro de la app instalada, porque corre en el mismo dominio.

### Publicarla en Google Play (opcional)
1. Publica el sitio en Render (abajo) y ábrelo una vez para revisar que cargue.
2. Entra a https://www.pwabuilder.com, pega tu dirección `https://sonex.onrender.com` y elige **Android → Generate package**.
3. PWABuilder te da un `.aab` para subir a Google Play Console y un archivo `assetlinks.json`.
4. Guarda ese archivo en `static/well-known/assetlinks.json` y vuelve a publicar en Render. La app lo sirve en `/.well-known/assetlinks.json` (así Android quita la barra del navegador).

Para la App Store, PWABuilder también genera un proyecto de iOS, pero necesitas una Mac con Xcode y una cuenta de Apple Developer.

> Nota: en el plan gratis de Render la base de datos está en `/tmp`, así que se borra cuando el servidor se reinicia. Antes de lanzar la app al público, conecta un disco persistente o una base de datos.

Incluye:
- Registro e inicio de sesión con contraseña, panel de cuenta, favoritos, carrito y pedidos.
- **Huella / Face ID de verdad** con llaves de acceso WebAuthn. Tu huella o tu rostro nunca salen de tu celular: Sonex solo guarda la llave pública.
- **Inicio de sesión con QR** desde otro celular (5 minutos, un solo uso, se aprueba desde tu cuenta).
- **Avatar al crear la cuenta**: robot rosa o robot turquesa, cambiable después.
- Tienda: Sonex Buds $2,499, Sonex One (diadema) $5,999, Sonex Studio (diadema) $7,499 y Sonex Air $3,499 MXN, todos con Neural Core, ANC adaptativo y traducción en vivo.
- Paleta del logo: morado `#3B276E`, rosa `#FF69B3`, turquesa `#00FFF7`, azul `#2585CA`, negro `#191E24`, blanco `#FFFFFF`.

## Correr en local

```bash
python -m venv .venv
source .venv/bin/activate   # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Abre http://localhost:5000

En local la huella / Face ID funciona solo si tu navegador lo permite en
localhost y tu dispositivo tiene sensor biométrico.

## Subirlo a GitHub

```bash
git init
git add .
git commit -m "Sonex: sitio web con Flask"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/sonex.git
git push -u origin main
```

No subas `sonex.db` ni `.env`: ya están en `.gitignore`.

## Publicarlo en Render (gratis)

1. Entra a https://render.com y crea una cuenta (o inicia sesión).
2. **New + → Web Service** → **Build and deploy from a Git repository**.
3. Conecta tu cuenta de GitHub y elige el repositorio `sonex`.
4. Render detecta el `render.yaml`: plan **Free**, `pip install -r requirements.txt` y `gunicorn app:app`.
5. En **Environment**, agrega estas variables:
   - `SECRET_KEY`: Render la genera sola (está en el `render.yaml`).
   - `RP_ID`: el hostname de tu app en Render, sin `https://`. Ejemplo: si tu app queda en `https://sonex.onrender.com`, pon `sonex.onrender.com`.
   - `DB_PATH`: `/tmp/sonex.db` (ya viene en el `render.yaml`).
   - `SECURE_COOKIES`: `1`
6. Dale a **Deploy** y espera a que diga **Live**. Tu página quedará en algo como `https://sonex.onrender.com`.

## Importante: la huella y el rostro

La huella / Face ID **solo funciona sobre HTTPS** (Render ya te da HTTPS) y en
un dispositivo con sensor de huella o Face ID. **No funciona** abriendo el
archivo como `file://`, ni en una página `http://` sin certificado. Por eso la
versión estática anterior no te agarraba la huella: no tenía servidor ni
HTTPS. Esta versión sí es el servidor real, así que en Render funciona.

Si en tu celular no te aparece la opción, revisa que:
- estés entrando a la dirección `https://` de Render (no al archivo descargado),
- tu celular tenga huella o Face ID configurada,
- uses Chrome o Safari actualizado.
