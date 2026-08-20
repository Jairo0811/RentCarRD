# Configuración de seguridad

La API ahora niega el acceso por defecto y exige JWT en todos los controladores, salvo `POST /api/auth/login`.

Antes de iniciar la API, configure secretos fuera del repositorio:

```powershell
$env:Jwt__Key = '<secreto-aleatorio-de-32-o-mas-caracteres>'
$env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD = '<contraseña-inicial-de-12-o-mas-caracteres>'
dotnet ef database update --project RentCar.API/RentCar.API
dotnet run --project RentCar.API/RentCar.API
Remove-Item Env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD
```

La contraseña bootstrap solo asigna credenciales cuando existe el empleado `admin` y su `PasswordHash` está vacío. Elimínela del entorno tras el primer arranque.

Los números completos de tarjeta dejaron de persistirse. La migración conserva únicamente los últimos cuatro dígitos y elimina titular y expiración. Para cobros reales debe integrarse un proveedor de pagos compatible con PCI DSS y guardar solamente su token.
