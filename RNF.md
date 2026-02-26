**Seguridad y control de acceso**

**RNF-01** Autorización por zona
El sistema debe garantizar que operaciones de promotor (roles/eventos/perfiles) solo se ejecuten dentro de su zona, con 0% de accesos permitidos fuera de zona.
**Verificación**: pruebas automatizadas de autorización (todas fuera de zona deben retornar 403).

**RNF-02** Registro de auditoría
El sistema debe registrar el 100% de acciones críticas: cambio de rol, edición, cancelación, eliminación, marcado “realizado”, asignación de puntos; con usuario, timestamp y diffs.
**Verificación**: suite de pruebas que ejecuta acciones y valida la existencia de logs.

**Rendimiento**

**RNF-03** Listado de perfiles por zona
La consulta “perfiles por zona” debe responder en ≤ 700 ms (p95) con hasta 5,000 perfiles en la zona.
**Verificación**: pruebas de carga con dataset de 5k.

**RNF-04** Guardado de itinerario
Guardar un itinerario con hasta 50 eventos debe brindar la informacion sin errores.
**Verificación**icación: prueba funcional y medición de tiempo en staging.

**Calidad de datos**

**RNF-05** Estados válidos y transiciones
El sistema debe impedir transiciones inválidas de estado (ej. de CANCELADO a OFICIAL) con tasa de error 0% en pruebas.
**Verificación**: pruebas de máquina de estados (state machine tests).

**RNF-06** Integridad de puntos
El sistema debe asegurar que la asignación de puntos sea únicamente 1 vez por evento y dentro de rango 1–10.
**Verificación**: intentos duplicados se rechazan o actualizan según regla definida.

**Usabilidad**

**RNF-07** Claridad visual de estado y confianza
En el detalle del evento, el estado (OFICIAL/PENDIENTE/CANCELADO/REALIZADO) y la confianza (100/75/…) deben ser visibles sin scroll en pantallas de todos los tamaños.
**Verificación**: revisión responsive en 360x640; elementos visibles en el primer viewport.