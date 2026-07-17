# 🚗 RentCarRD — Sistema de Gestión de Rentas

<p align="center">
  <img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github&perline=11" alt="Tecnologías de RentCarRD" />
</p>

<p align="center">
  <strong>Sistema web para la administración integral de empresas de alquiler de vehículos.</strong><br>
  Desarrollado con Angular, ASP.NET Core Web API, Entity Framework Core y Microsoft SQL Server.
</p>

---

## 📖 Descripción

**RentCarRD** es una aplicación web orientada a la gestión operativa de empresas de renta de vehículos.

El sistema centraliza la administración de clientes, empleados, vehículos, catálogos, inspecciones, rentas, devoluciones y reportes. También permite generar contratos y reportes profesionales en PDF, aplicar reglas de negocio sobre la disponibilidad de la flota y asociar cada operación al empleado responsable.

El proyecto utiliza una arquitectura **cliente-servidor**:

- **Frontend:** Angular y TypeScript.
- **Backend:** ASP.NET Core Web API y C#.
- **Persistencia:** Entity Framework Core y Microsoft SQL Server.
- **Comunicación:** API REST utilizando JSON.

RentCarRD forma parte de una colección de proyectos académicos desarrollados en la **Universidad APEC (UNAPEC)**, tomando como referencia el listado de proyectos propuestos por el profesor **Juan Pablo Valdez Reyes**.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso principal |
|---|---|
| Angular | Aplicación web frontend |
| TypeScript | Lógica, tipado y componentes del cliente |
| HTML5 | Estructura de las vistas |
| CSS3 | Estilos personalizados |
| Bootstrap 5 | Diseño responsivo y componentes visuales |
| ASP.NET Core Web API | API REST del backend |
| C# | Reglas de negocio y controladores |
| Entity Framework Core | Acceso y mapeo de datos |
| Microsoft SQL Server | Base de datos relacional |
| jsPDF | Generación de documentos PDF |
| jsPDF AutoTable | Tablas profesionales en PDF |
| Git y GitHub | Control de versiones |

---

## 🏗️ Arquitectura

```text
┌──────────────────────────┐
│ Angular + TypeScript     │
│ Frontend SPA             │
└────────────┬─────────────┘
             │ HTTP / JSON
             ▼
┌──────────────────────────┐
│ ASP.NET Core Web API     │
│ Controladores y reglas   │
└────────────┬─────────────┘
             │ EF Core
             ▼
┌──────────────────────────┐
│ Microsoft SQL Server     │
│ Persistencia de datos    │
└──────────────────────────┘
```

El frontend está configurado como una **Single Page Application (SPA)**. La API expone endpoints REST para las operaciones de clientes, empleados, vehículos, inspecciones, rentas y catálogos.

---

## ✨ Funcionalidades

### 📊 Dashboard ejecutivo

- Panel principal con indicadores operativos.
- Total de vehículos registrados.
- Vehículos disponibles, rentados y no disponibles.
- Total de clientes.
- Rentas activas y concluidas.
- Ingresos acumulados.
- Últimas rentas registradas.
- Vehículos añadidos recientemente.
- Accesos rápidos a los módulos principales.

### 👤 Gestión de clientes

- Registro, edición y eliminación de clientes.
- Activación e inactivación de registros.
- Validación local de cédula dominicana.
- Prevención de cédulas duplicadas.
- Administración del límite de crédito.
- Restricción para impedir límites de crédito negativos.
- Registro del tipo de persona.
- Registro opcional de método de pago ficticio.
- Nombre del titular de la tarjeta.
- Número de tarjeta con formato automático.
- Fecha de expiración.
- Detección de Visa, Mastercard, AMEX y Discover.
- Validación del número mediante algoritmo de Luhn.
- Visualización de la franquicia y últimos cuatro dígitos.
- El CVV se utiliza únicamente de forma temporal y no se almacena.

### 👨‍💼 Gestión de empleados

- Registro, edición y eliminación de empleados.
- Activación e inactivación de cuentas.
- Validación de cédula.
- Inicio de sesión de empleados.
- Asociación automática del empleado responsable a cada renta.
- Separación de permisos entre administrador y empleado.

### 🚗 Gestión de vehículos

- Registro, edición y eliminación de vehículos.
- Carga y vista previa de imágenes.
- Buscador en tiempo real.
- Búsqueda por descripción, marca, modelo, placa, chasis, motor, tipo, combustible y estado.
- Filtros por estado operativo.
- Contadores de vehículos disponibles, rentados y no disponibles.
- Validación de placa alfanumérica de 6 a 7 caracteres.
- Validación de chasis alfanumérico de hasta 17 caracteres.
- Conversión automática de placa, chasis y motor a mayúsculas.
- Prevención de placas y chasis duplicados.
- Estados operativos:
  - `Disponible`
  - `Rentado`
  - `NoDisponible`

### 📚 Catálogos

- Marcas.
- Modelos relacionados con marcas.
- Tipos de vehículos.
- Tipos de combustible.

### 🔍 Inspección de flota

- Registro de inspecciones.
- Asociación con cliente y vehículo.
- Estado de gomas.
- Estado de cristales.
- Goma de repuesto.
- Gato hidráulico.
- Nivel de combustible.
- Ralladuras.
- Observaciones generales.

### 🔑 Gestión de rentas

- Registro de contratos de renta.
- Selección de cliente y vehículo.
- Asociación del empleado autenticado.
- Cálculo automático del total.
- Registro de tarifa por día y cantidad de días.
- Cambio automático del vehículo de `Disponible` a `Rentado`.
- Restricción para impedir rentar un vehículo que ya tenga historial de renta.
- Generación de contrato profesional en PDF.

### 🔄 Gestión de devoluciones

- Procesamiento de la devolución del vehículo.
- Cambio automático de la renta a `Concluida`.
- Cálculo de la fecha de devolución a partir de la fecha de renta y los días contratados.
- Visualización de la fecha de devolución en la página de rentas.
- Cambio del vehículo devuelto a `NoDisponible`.
- Bloqueo para impedir que un vehículo devuelto vuelva a rentarse.
- Conservación del historial de la operación.

### 📄 Reportes y documentos PDF

- Contrato profesional de renta.
- Reporte general de rentas y consultas.
- Información de la empresa.
- Información del cliente.
- Información del vehículo.
- Marca, modelo y placa.
- Información del empleado responsable.
- Fecha de renta y fecha de devolución.
- Estado de la renta.
- Tarifa diaria, cantidad de días y total facturado.
- Resumen financiero.
- Firmas del cliente y representante.
- Formato listo para impresión.

---

## 🔐 Roles y acceso

### 👑 Administrador

Tiene acceso completo a:

- Dashboard.
- Clientes.
- Empleados.
- Vehículos.
- Catálogos.
- Inspecciones.
- Rentas y devoluciones.
- Reportes.

### 👨‍💼 Empleado

Puede:

- Registrar clientes.
- Consultar vehículos disponibles.
- Registrar rentas.
- Procesar operaciones permitidas.
- Generar contratos.

Cada renta queda asociada automáticamente al empleado que realizó la operación.

> Las credenciales predeterminadas del entorno académico deben cambiarse antes de utilizar el sistema fuera de un entorno de demostración.

---

## 📂 Estructura del proyecto

```text
RentCarRD
│
├── RentCar.API
│   ├── Controllers
│   ├── Models
│   ├── Properties
│   ├── wwwroot
│   │   └── vehiculos
│   ├── Program.cs
│   └── appsettings.json
│
├── RentCarClient
│   ├── public
│   │   └── images
│   │       ├── cards
│   │       └── logo.png
│   ├── src
│   │   └── app
│   │       ├── components
│   │       ├── services
│   │       ├── app.routes.ts
│   │       └── app.config.ts
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.app.json
│
├── RentCarDB.sql
└── README.md
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jairo0811/RentCarRD.git
cd RentCarRD
```

### 2. Configurar la base de datos

1. Abrir Microsoft SQL Server Management Studio.
2. Ejecutar el archivo:

```text
RentCarDB.sql
```

3. Verificar la cadena de conexión en:

```text
RentCar.API/appsettings.json
```

### 3. Ejecutar el backend

```bash
cd RentCar.API
dotnet restore
dotnet build
dotnet run
```

Swagger estará disponible normalmente en:

```text
http://localhost:5266/swagger
```

### 4. Ejecutar el frontend

En otra terminal:

```bash
cd RentCarClient
npm install --legacy-peer-deps
ng serve -o
```

La aplicación estará disponible en:

```text
http://localhost:4200
```

> El modificador `--legacy-peer-deps` evita conflictos de resolución entre `ng2-charts` y Angular CDK en la configuración actual del proyecto.

---

## 🧪 Flujo de prueba recomendado

1. Iniciar sesión como administrador.
2. Registrar o verificar los catálogos.
3. Registrar empleados y clientes.
4. Registrar vehículos con imagen.
5. Crear una inspección.
6. Registrar una renta.
7. Verificar que el vehículo cambie a `Rentado`.
8. Generar el contrato PDF.
9. Procesar la devolución.
10. Verificar que:
   - la renta aparezca como `Concluida`;
   - se muestre la fecha de devolución;
   - el vehículo aparezca como `NoDisponible`;
   - el vehículo no pueda volver a rentarse;
   - los reportes PDF reflejen la devolución.

---

## 📊 Estado del proyecto

| Módulo | Estado |
|---|:---:|
| Dashboard | ✅ Finalizado |
| Clientes | ✅ Finalizado |
| Empleados | ✅ Finalizado |
| Vehículos | ✅ Finalizado |
| Catálogos | ✅ Finalizado |
| Inspecciones | ✅ Finalizado |
| Rentas | ✅ Finalizado |
| Devoluciones | ✅ Finalizado |
| Reportes PDF | ✅ Finalizado |
| Login y roles | ✅ Finalizado |
| API REST | ✅ Finalizado |
| SQL Server | ✅ Finalizado |

---

## 🚀 Posibles mejoras futuras

- Reservas y calendario de disponibilidad.
- Historial de mantenimiento de vehículos.
- Notificaciones por correo electrónico.
- Exportación de reportes a Excel.
- Firma digital de contratos.
- Integración con pasarelas de pago.
- Recuperación de contraseña.
- Autenticación con JWT y contraseñas cifradas.
- Pruebas unitarias y de integración.
- Dockerización del frontend, backend y base de datos.
- Despliegue en Azure, AWS o infraestructura propia.
- Conversión a una plataforma multiempresa tipo SaaS.

---

## 👨‍💻 Autor

**Francis Jairo Matías Rosario**

- 🎓 Universidad APEC (UNAPEC)
- 📚 Ingeniería de Software
- 🆔 Matrícula: **A00115261**
- 💼 Proyecto académico y de portafolio profesional

---

<p align="center">
  Desarrollado con ❤️ por <strong>Francis Jairo Matías Rosario</strong>
</p>
