**Gestión de roles y zona**

**RF-01** Asignación de roles por promotor
El sistema debe permitir que el promotor asigne roles a usuarios dentro de su zona, pudiendo cambiar un rol existente.
**Verificación**: un promotor cambia el rol de un usuario y el sistema refleja el cambio inmediatamente en permisos.

**RF-02** Restricción por zona para gestión de roles
El sistema debe permitir que un promotor administre roles solo de usuarios asociados a su zona.
**Verificación**: si intenta cambiar rol fuera de su zona, el sistema responde con bloqueo/denegación.

**RF-03** Visualización de perfiles por zona
El sistema debe permitir al promotor visualizar la lista de perfiles creados y asociados a su zona, incluyendo nombre, rol actual y nivel de confianza.
**Verificación**: el promotor consulta y obtiene únicamente perfiles de su zona.

**Publicación por cualquier usuario y confianza**

**RF-04** Publicación abierta de eventos
El sistema debe permitir que cualquier usuario autenticado publique un evento (evento comunitario).
**Verificación**: un explorador crea evento y queda registrado.

**RF-05** Cálculo y visualización del nivel de confianza
El sistema debe asignar un nivel de confianza fijo por rol y mostrarlo en el evento:

Promotor: 100

Explorador: 75

Validador: 50
**Verificación**: al crear evento, el detalle muestra “Confianza: X” según el rol.

**RF-06** Priorización por confianza en listados
El sistema debe ordenar por defecto los eventos en listados priorizando:

Eventos Oficiales, 2) Mayor confianza, 3) Proximidad (distancia).
**Verificación**: en igualdad de fecha, un evento oficial/promotor aparece antes que uno comunitario.

**Estados del evento y ciclo de vida**

**RF-07** Estados obligatorios del evento
El sistema debe manejar y persistir los estados:

OFICIAL

PENDIENTE_CONFIRMACION

CANCELADO

REALIZADO
**Verificación**: cada evento siempre tiene exactamente un estado válido.

**RF-08** Creación inicial por rol

Si el creador es Promotor, el evento se crea como OFICIAL.

Si el creador es Explorador/otro, el evento se crea como PENDIENTE_CONFIRMACION.
**Verificación**: crear evento con ambos roles y confirmar estado inicial.

**RF-09** Eliminación permitida en pendiente
El sistema debe permitir eliminar eventos solo si están en estado PENDIENTE_CONFIRMACION.
**Verificación**: evento “pendiente” se elimina; evento “oficial”/“realizado” no se puede eliminar (solo cancelar o desactivar según reglas).

**RF-10** Edición y actualización por promotor
El sistema debe permitir al promotor editar eventos de su zona (título, descripción, fecha/hora, ubicación, categorías) y guardar historial de cambios.
**Verificación**: un cambio crea un registro de auditoría con usuario/fecha/campos modificados.

**RF-11** Cancelación y estado cancelado
El sistema debe permitir al promotor cancelar un evento y cambiar su estado a CANCELADO.
**Verificación**: al cancelar, el evento ya no aparece como disponible para asistir (solo visible como cancelado).

**RF-12** Marcar como realizado
El sistema debe permitir al promotor marcar un evento como REALIZADO una vez pasada la hora de fin.
**Verificación**: si el evento no ha finalizado, el sistema bloquea “marcar realizado”.

**Itinerarios sin límite de 3**

**RF-13** Itinerario sin límite fijo
El sistema debe permitir crear un itinerario con x eventos (x ≥ 1), sin límite fijo de 3.
**Verificación**: el usuario puede agregar 4, 5 o más eventos y se guarda correctamente.

**RF-14** Orden y gestión del itinerario
El sistema debe permitir reordenar eventos del itinerario y eliminar eventos individualmente.
**Verificación**: el orden guardado se conserva al recargar.

**Asistencia, participación y puntos**

**RF-15** Registro de participación (porcentaje)
El promotor debe poder aisgnar un porcentaje de participacion al evento en base a la asistencia esperada.
**Verificación**: con valores conocidos, el porcentaje calculado coincide.

**RF-16** Clasificación automática de participación
El sistema debe clasificar el evento según el porcentaje:

Alta: ≥ 80

Moderada: 60–79

Regular: 40–59

Baja: ≤ 39
**Verificación**: con porcentajes de prueba (85, 70, 50, 20) se asigna la etiqueta correcta.

**RF-17** Confirmación final por promotor
El sistema debe permitir que el promotor confirme la categoría final de asistencia del evento (alta/moderada/regular/baja).
**Verificación**: el promotor puede aprobar la clasificación o ajustarla (quedando registro del ajuste).

**RF-18** Asignación de puntos 1 a 10
El sistema debe permitir al promotor asignar una calificación de puntos (1–10) al evento una vez marcado como REALIZADO.
**Verificación**: el sistema no permite asignar puntos antes de REALIZADO; permite valores solo del 1 al 10.

**RF-19** Puntos por descubrimiento al sugerente
Si un evento fue sugerido por un usuario (no promotor) y luego se confirma su asistencia, el sistema debe otorgar al sugerente los puntos asignados por el promotor.
**Verificación**: evento sugerido por explorador recibe puntos al final; se reflejan en el perfil del sugerente.