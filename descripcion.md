# PartyCR

## Descripción del proyecto

PartyCR es una plataforma web para la gestión de eventos locales con enfoque colaborativo y geolocalizado. El sistema permite crear, visualizar, validar y administrar eventos dentro de una zona específica, con control de acceso según roles y trazabilidad de acciones mediante auditoría.

La aplicación fue construida con una arquitectura separada de **frontend** y **backend**, usando **Node.js**, **Express**, **MongoDB** y un frontend en **HTML, CSS, JavaScript y Bootstrap**.

## Objetivo del sistema

El objetivo de PartyCR es permitir que distintos tipos de usuarios gestionen eventos en sus zonas, validen publicaciones, controlen la participación y consulten eventos cercanos en un mapa.

## Funcionalidades principales

### Gestión de usuarios y roles
- Inicio de sesión con autenticación basada en token.
- Gestión de perfiles por rol.
- Roles disponibles:
  - **Promotor**: controla eventos y perfiles dentro de su zona.
  - **Explorador**: consulta y publica eventos en su zona.
  - **Validador**: revisa, aprueba, rechaza y recategoriza eventos.
- El promotor principal definido en `seedUsers` puede:
  - ver todos los usuarios creados,
  - crear nuevos promotores,
  - asignarles zona directamente.

### Gestión de eventos
- Crear eventos con:
  - título,
  - descripción,
  - categorías,
  - fecha,
  - zona,
  - nombre del lugar,
  - dirección,
  - foto.
- Separación entre:
  - página para crear eventos,
  - página para ver eventos existentes.
- Edición, cancelación y eliminación de eventos según reglas de negocio.
- Confirmación visual antes de ejecutar acciones sensibles.

### Ubicación y mapa
- Posibilidad de marcar manualmente la ubicación del evento en un mapa al crearlo.
- Si no se marca manualmente, el backend intenta geocodificar automáticamente la dirección.
- Visualización de eventos cercanos en el `dashboard` usando mapa.
- Búsqueda de eventos por radio de distancia.

### Validación y asistencia
- Aprobar y rechazar eventos.
- Recategorizar eventos.
- Detectar duplicados.
- Marcar eventos como realizados.
- Registrar porcentaje de participación.
- Confirmar clasificación final:
  - Alta,
  - Moderada,
  - Regular,
  - Baja.
- Asignar puntos del 1 al 10.

### Auditoría
- Registro de acciones importantes en base de datos.
- Consulta de auditoría desde una vista dedicada del sistema.

## Tecnologías utilizadas

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT para autenticación
- bcryptjs para cifrado de contraseñas
- Multer para carga de imágenes
- CORS
- dotenv

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Bootstrap Icons
- Leaflet para mapas

## Estructura general del proyecto

```bash
Eventos-CR/
├── Controllers/
├── Middleware/
├── Models/
├── Rutas/
├── public/
│   ├── css/
│   ├── js/
│   ├── dashboard.html
│   ├── eventos.html
│   ├── crear-evento.html
│   ├── detalle-eventos.html
│   ├── perfiles.html
│   ├── moderation.html
│   ├── auditoria.html
│   └── intinerarios.html
├── uploads/
├── server.js
├── package.json
└── .env
```

## Dependencias del proyecto

Instala estas dependencias en el backend:

```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv multer
```

Dependencia para desarrollo:

```bash
npm install -D nodemon
```

## Ejemplo de `package.json`

```json
{
  "name": "partycr",
  "version": "1.0.0",
  "description": "Plataforma colaborativa de eventos locales con geolocalización",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Instalación del proyecto

### 1. Clonar o descargar el proyecto

Desde el enlace de GITHUB, puedes descargar los archivos a tu computador y ser creado completamenta 
Coloca la carpeta del proyecto en tu equipo.

### 2. Entrar en la carpeta del proyecto
```bash
cd Eventos-CR
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Crear archivo `.env`
Dentro de la raíz del proyecto crea un archivo `.env` con un contenido similar a este:

```env
PORT=5500
MONGO_URI=tu_cadena_de_conexion_mongodb
JWT_SECRET=tu_clave_secreta
```

## Comandos de ejecución

### Ejecutar en modo normal
```bash
npm start
```

### Ejecutar en modo desarrollo
```bash
npm run dev
```

## Acceso al sistema

Cuando el servidor esté levantado, puedes abrir la aplicación en:

```bash
http://localhost:5500
```

Si tu servidor sirve los archivos del frontend desde `public`, también puedes acceder directamente a páginas como:

```bash
http://localhost:5500/dashboard.html
http://localhost:5500/eventos.html
http://localhost:5500/crear-evento.html
```

## Seed de usuarios

El sistema puede incluir usuarios iniciales cargados desde `seedUsers`. Entre ellos se encuentra el promotor principal:

- **Correo**: `p_adi_kamakiri@gmail.com`
- **Rol**: `Promotor`

Este usuario tiene privilegios especiales definidos en la lógica del proyecto, como:
- crear promotores y asignarles zona,
- ver todos los usuarios creados,
- gestionar reglas especiales sobre promotores.

## Flujo básico de uso

### Crear evento
1. Iniciar sesión.
2. Entrar a `crear-evento.html`.
3. Llenar los datos del evento.
4. Cargar una imagen opcional.
5. Marcar la ubicación manualmente en el mapa o dejar que el sistema la calcule.
6. Guardar el evento.

### Ver eventos
1. Ir a `eventos.html`.
2. Filtrar por estado, zona, fuente, categoría o lugar.
3. Abrir el detalle del evento.

### Administrar evento
Desde `detalle-eventos.html`, el promotor puede:
- cancelar,
- eliminar,
- marcar como realizado,
- registrar participación,
- confirmar clasificación,
- asignar puntos.

## Confirmaciones de acciones

El sistema muestra mensajes de confirmación y validación cuando se realizan acciones importantes, por ejemplo:
- cancelar evento,
- eliminar evento,
- marcar como realizado,
- registrar participación,
- confirmar clasificación,
- asignar puntos.

## Auditoría del sistema

La aplicación registra acciones importantes en la colección de auditoría, por ejemplo:
- creación de eventos,
- actualización de eventos,
- cancelación,
- eliminación,
- creación de usuarios,
- cambios de rol,
- cambios de zona,
- validación de eventos.

Estas acciones pueden consultarse desde la pantalla de auditoría.

## Recomendaciones de uso

- Usar nombres de lugares reales para que la geolocalización funcione mejor.
- Completar la dirección con la mayor precisión posible.
- Verificar que MongoDB esté conectado antes de iniciar el sistema.
- Confirmar que el archivo `.env` tenga valores correctos.
- Permitir acceso a ubicación en el navegador para ver eventos cercanos en el mapa del dashboard.

## Posibles mejoras futuras

- Autocompletado de lugares al escribir direcciones.
- Modales de confirmación con Bootstrap en lugar de `confirm()`.
- Panel de administración más avanzado para el promotor principal.
- Reportes estadísticos por zona.
- Despliegue en la nube.

## Autoría del proyecto

Este proyecto fue construido y ampliado progresivamente con enfoque en:
- gestión de eventos,
- control por roles,
- validación,
- auditoría,
- geolocalización,
- visualización en mapas.
