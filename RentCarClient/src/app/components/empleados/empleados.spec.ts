import { validarPassword } from './empleados';
import { EmpleadoService } from '../../services/empleado.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { vehiculo } from '../../testing/datos';

describe('Empleados y vehículos: reglas de formulario y cuerpos enviados', () => {
  it('política de contraseña igual a la API', () => {
    expect(validarPassword('', true)).toMatch(/obligatoria/);
    expect(validarPassword('', false)).toBeNull();
    expect(validarPassword('corta1', true)).toMatch(/8 y 128/);
    expect(validarPassword('solosletras', true)).toMatch(/letra y un número/);
    expect(validarPassword('12345678', true)).toMatch(/letra y un número/);
    expect(validarPassword('Segura2026', true)).toBeNull();
  });

  it('la contraseña solo viaja cuando se escribe una nueva', () => {
    const base = { nombre: 'Ana', cedula: '40212428508', tandaLabor: 'Matutina', porcientoComision: 5, fechaIngreso: '2026-11-17', estado: true, usuario: 'ana' };
    expect(EmpleadoService.cuerpo({ ...base, password: '' })).not.toHaveProperty('password');
    expect(EmpleadoService.cuerpo({ ...base, password: 'Nueva2026' })).toHaveProperty('password', 'Nueva2026');
    expect(EmpleadoService.cuerpo({ ...base, rol: 'Admin' } as never)).not.toHaveProperty('rol');
  });

  it('la ruta de la imagen nunca se envía al editar un vehículo', () => {
    const cuerpo = VehiculoService.cuerpo(vehiculo(1, 'Disponible', { imagenUrl: '/vehiculos/../../appsettings.json' }));
    expect(cuerpo).not.toHaveProperty('imagenUrl');
    expect(cuerpo).not.toHaveProperty('id');
  });
});
