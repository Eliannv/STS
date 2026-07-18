# Servidor legado

Este directorio conserva el backend monolítico original como respaldo de la migración a microservicios.

No forma parte del entorno activo de Docker Compose. Sus servicios están bajo el perfil `legacy`.

Para iniciarlo de forma aislada:

```powershell
docker compose --profile legacy up -d servidor postgres
```

El entorno activo utiliza `bff-servicio` y los microservicios independientes.
