# CLAUDE.md — STS Project (Óptica Macías)

Guías de comportamiento para reducir errores comunes en desarrollo con IA.
Derivadas de las observaciones de Andrej Karpathy sobre LLMs en producción.
Fuente: https://github.com/multica-ai/andrej-karpathy-skills

---

## 1. Think Before Coding

**No asumas. No ocultes confusión. Expón los trade-offs.**

Antes de implementar:
- Declara tus suposiciones explícitamente. Si hay duda, pregunta.
- Si existen múltiples interpretaciones, preséntelas — no elijas en silencio.
- Si existe un enfoque más simple, dilo. Objeta cuando sea necesario.
- Si algo no está claro, detente. Nombra qué confunde. Pregunta.

---

## 2. Simplicity First

**Código mínimo que resuelve el problema. Nada especulativo.**

- Sin features más allá de lo pedido.
- Sin abstracciones para código de un solo uso.
- Sin "flexibilidad" o "configurabilidad" no solicitada.
- Sin manejo de errores para escenarios imposibles.
- Si escribes 200 líneas y podrían ser 50, reescríbelo.

Pregúntate: "¿Diría un senior engineer que esto está sobrecomplicado?" Si sí, simplifica.

---

## 3. Surgical Changes

**Toca solo lo que debes. Limpia solo tu propio desorden.**

Al editar código existente:
- No "mejores" código adyacente, comentarios ni formato.
- No refactorices cosas que no están rotas.
- Mantén el estilo existente, aunque lo harías diferente.
- Si notas dead code no relacionado, menciónalo — no lo elimines.

Cuando tus cambios creen huérfanos:
- Elimina imports/variables/funciones que TUS cambios dejaron sin uso.
- No elimines dead code preexistente a menos que se pida.

La prueba: Cada línea cambiada debe trazarse directamente a la solicitud del usuario.

---

## 4. Goal-Driven Execution

**Define criterios de éxito. Itera hasta verificar.**

Transforma tareas en metas verificables:
- "Agregar validación" → "Escribir tests para inputs inválidos, luego hacer que pasen"
- "Corregir el bug" → "Escribir un test que lo reproduzca, luego hacer que pase"
- "Refactorizar X" → "Asegurar que los tests pasen antes y después"

Para tareas multi-paso, declara un plan breve:
```
1. [Paso] → verificar: [comprobación]
2. [Paso] → verificar: [comprobación]
3. [Paso] → verificar: [comprobación]
```

Criterios de éxito fuertes permiten iterar de forma independiente. Criterios débiles ("que funcione") requieren aclaraciones constantes.

---

**Estas guías funcionan si:** menos cambios innecesarios en diffs, menos reescrituras por sobrecomplicación, y las preguntas de clarificación llegan antes de la implementación, no después de los errores.

**Trade-off:** Estas guías priorizan la cautela sobre la velocidad. Para tareas triviales, usa el criterio — no cada cambio necesita todo el rigor.

---

## Project-Specific Guidelines — STS Project / Óptica Macías

### Stack tecnológico
- **Backend:** Node.js + Express.js (ESModules, `"type": "module"`)
- **Base de datos:** PostgreSQL via `pg` (sin ORM)
- **Auth:** JWT (`jsonwebtoken`) + bcryptjs
- **Contenedores:** Docker + docker-compose
- **Arquitectura:** Hexagonal (Puertos y Adaptadores)

### Reglas de arquitectura hexagonal (NO negociables)

```
src/
  dominio/
    entidades/        ← Clases JS puras, sin decoradores, sin frameworks
    filtros/          ← Objetos de filtro para queries
  aplicacion/
    puertos/
      entrada/        ← Interfaces que los controladores invocan
      salida/         ← Interfaces que los adaptadores implementan
    uses-cases/
      command/        ← CasoDeUso que muta estado
      query/          ← CasoDeUso que solo lee
    dto/              ← Data Transfer Objects de entrada
  infraestructura/
    adaptador-entrada/  ← Controladores Express
    adaptador-salida/   ← Repositorios PostgreSQL
    base-dato/          ← Pool de conexión pg
    contenedor/         ← Inyección de dependencias manual
    middleware/         ← Auth JWT, validación, CORS
    rutas/              ← Definición de rutas Express
```

### Convenciones de nomenclatura
- Entidades: `PascalCase.js` → `Cliente.js`, `Factura.js`
- Adaptadores salida: `{Entidad}PgsCommandAdaptador.js` / `{Entidad}PgsQueryAdaptador.js`
- Controladores: `{Entidad}Controlador.js`
- Casos de uso: `{Entidad}CommandUsesCase.js` / `{Entidad}QueryUsesCase.js`
- Rutas: `modulo{Entidad}Rutas.js`
- Puertos salida: `{Entidad}SalidaCommandPuerto.js` / `{Entidad}SalidaQueryPuerto.js`

### Reglas de dominio
- Las entidades son clases JavaScript puras (no TypeScript, no decoradores)
- Zero dependencias de frameworks en `dominio/`
- Los puertos son clases abstractas con métodos que lanzan `Error('No implementado')`
- Los adaptadores extienden sus respectivos puertos

### Base de datos
- Schema: `optica_schema.sql` — 22 tablas con tipos ENUM, PKs SERIAL, FKs e índices
- Las queries van directamente en los adaptadores de salida usando `pool.query(...)`
- Formato respuesta estándar: `{ estado: 'ok'|'error', resultado: ... }`

### Módulos ya implementados en STS servidor
✅ Sucursal · Usuario · Cliente · HistorialClinico
✅ Proveedor · Producto · Ingreso · CobroDeuda
✅ Factura · CajaBanco · CajaChica

### Módulos pendientes (Óptica Macías → STS)
⏳ Catalogo (catalogo_items) · Egresos · Cuentas · VentasTarjeta · Empleados · Informes

### Variables de entorno (.env)
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET
PORT
```
