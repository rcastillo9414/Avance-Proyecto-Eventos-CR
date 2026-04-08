# Nombre del proyecto:  PartyCR App

Plataforma colaborativa y ubicacion real  que centra el descubrimiento de eventos locales (culturales, recreativos y sociales) en tiempo real.  
El sistema reduce la dependencia del “boca a boca” y combina **fuentes oficiales** (promotores verificados) y **fuentes comunitarias** (sugerencias por usuarios) con un proceso de **validación**.

## Roles del sistema
- **Usuario/Explorador:** descubre eventos en mapa, filtra, guarda listas, confirma asistencia, reseña post-evento y sugiere eventos.
- **Promotor/Organizador:** publica y gestiona eventos oficiales, revisa sugerencias en su zona y cancela eventos bajo una regla de tiempo.
- **Moderador/Validador de zona:** valida sugerencias comunitarias, categoriza y fusiona duplicados.

---

## Convenciones de nomenclatura y formato de código

### Nomenclatura
- **Archivos y carpetas:** `kebab-case`  
  Ejemplos: `event-service.ts`, `user-profile`, `map-view`
- **Clases / Componentes:** `PascalCase`  
  Ejemplos: `EventCard`, `MapView`, `EventValidator`
- **Variables y funciones:** `camelCase`  
  Ejemplos: `getEventsByRadius()`, `validateEvent()`, `cancelEvent()`
- **Constantes:** `UPPER_SNAKE_CASE`  
  Ejemplos: `MAX_CANCEL_HOURS`, `DEFAULT_RADIUS_KM`
- **Endpoints REST:** plural y recursos  
  Ejemplos: `/events`, `/events/{id}`, `/users/{id}/lists`

### Formato de código
- Indentación: **2 espacios**
- Longitud de línea recomendada: **máx. 100 caracteres**
- No se aceptan `console.log` en producción (usar logger)
- Validaciones obligatorias en backend (fechas, coordenadas, roles)
- Manejo de errores con respuestas consistentes (código + mensaje + detalle)

---

## Estrategia de branches y commits

### Branches (Git Flow simplificado)
- `main`: estable (listo para release)
- `develop`: integración continua de features
- `feature/<descripcion-corta>`: nuevas funcionalidades  
  Ej.: `feature/map-filters`
- `fix/<descripcion-corta>`: corrección de bugs  
  Ej.: `fix/cancel-rule-63h`
- `docs/<descripcion-corta>`: cambios de documentación  
  Ej.: `docs/update-readme`

### Reglas
- PR obligatorio hacia `develop`.
- `main` solo recibe merges desde `develop` (por release).
- Cada PR debe incluir:
  - Descripción
  - Evidencia (capturas o pasos de prueba)
  - Checklist de verificación

---

## Convención de mensajes de commit
Los commits siguen **Conventional Commits**:

Formato:
<type>(<scope>): <descripcion>

Ejemplos:
- `feat(map): Se agrega un filtro por distancia y agrupacion de eventos `
- `fix(events): Cancelaciones bloqueadas menos de 63 horas del evento`
- `docs(requirements): Se agregaron parametros para aceptacion para las alertas de los mapas `

---

## Tipos de commit
- `feat`: nueva funcionalidad
- `fix`: corrección de bugs
- `docs`: documentación
- `style`: formato (sin cambios lógicos)
- `refactor`: refactorización (sin cambiar funcionalidad)
- `test`: pruebas
- `chore`: tareas de mantenimiento (deps, scripts, configs)
- `perf`: mejoras de rendimiento
- `ci`: cambios en pipelines/CI

---

## Documentación de requerimientos
- Requerimientos funcionales: `requirements/functional-requirements.md`
- Requerimientos no funcionales: `requirements/non-functional-requirements.md`