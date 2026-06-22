# 🚗 RentCarRD - Sistema de Gestión de Rentas

Un sistema integral (Punto de Venta y Gestión) desarrollado para administrar eficientemente las operaciones de una empresa de renta de vehículos. Este proyecto implementa una arquitectura robusta de tres capas (Presentación, Lógica de Negocio y Acceso a Datos) para garantizar seguridad, escalabilidad y un rendimiento óptimo.

## 🛠️ Stack Tecnológico

Este proyecto fue desarrollado utilizando tecnologías modernas y herramientas Open Source:

* **Frontend (Cliente):** Angular, TypeScript, HTML5, CSS3, Bootstrap 5.
* **Backend (API Rest):** .NET Core / C#.
* **Base de Datos:** Microsoft SQL Server.
* **Generación de Reportes:** jsPDF & jsPDF-AutoTable.

## 📦 Módulos Principales

El sistema (MVP) cuenta con los siguientes módulos completamente funcionales:

1. **Gestión de Clientes:** * Registro y edición inteligente de clientes.
   * Validación matemática en el backend para longitud y formato de Cédula (11 dígitos) y RNC (9 dígitos).
2. **Gestión de Vehículos:** * Mantenimiento de inventario incluyendo marcas, modelos, tipos de vehículo y tipos de combustible.
3. **Inspección Previa:** * Sistema de checklist físico para auditar el estado del vehículo (ralladuras, cristales, nivel de combustible, gomas) antes de habilitar el contrato.
4. **Operaciones de Renta y Devolución:** * Creación de contratos de renta vinculando vehículo y cliente.
   * Cálculo automático del total facturado basado en días y tarifa.
   * Procesamiento de devoluciones para cerrar el ciclo del contrato.
5. **Reportes y Auditoría:**
   * Generación de reportes PDF descargables en formato profesional con moneda local (RD$).

## 🚀 Instalación y Ejecución Local

### 1. Base de Datos
* Ejecutar el script `BaseDeDatos.sql` adjunto en el repositorio dentro de Microsoft SQL Server para generar la estructura de tablas y registros iniciales (incluyendo el Empleado de administración).

### 2. Backend (.NET)
* Abrir la solución en Visual Studio.
* Verificar que la cadena de conexión (`ConnectionString`) en el archivo `appsettings.json` apunte a la instancia local de SQL Server.
* Para ejecutar la API por terminal:
  ```bash
  dotnet run  

### 3. Frontend (Angular)
* Abrir la terminal en la carpeta `RentCarClient`.
* Ejecutar los siguientes comandos:

**Instalar dependencias:**
```bash
npm install
*Ejecutar servidor:*
ng serve -o
