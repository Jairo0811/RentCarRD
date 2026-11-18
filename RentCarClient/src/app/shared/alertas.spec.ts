import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { confirmar, mensajeError, notificar, tipoDeMensaje } from './alertas';

describe('Mensajería uniforme', () => {
  const error = (status: number, cuerpo: unknown) => new HttpErrorResponse({ status, error: cuerpo });

  it('extrae mensajes de texto plano, { mensaje } y ProblemDetails', () => {
    expect(mensajeError(error(409, 'Este vehículo ya fue rentado anteriormente.'))).toBe('Este vehículo ya fue rentado anteriormente.');
    expect(mensajeError(error(401, { mensaje: 'Credenciales incorrectas.' }))).toBe('Credenciales incorrectas.');
    expect(mensajeError(error(409, { title: 'Registro duplicado', detail: 'Ya existe un registro.' }))).toBe('Ya existe un registro.');
  });

  it('une los errores de validación de ASP.NET Core', () => {
    const cuerpo = { title: 'One or more validation errors occurred.', errors: { MontoXDia: ['El monto por día debe estar entre RD$ 0.01 y RD$ 1,000,000.'] } };
    expect(mensajeError(error(400, cuerpo))).toBe('El monto por día debe estar entre RD$ 0.01 y RD$ 1,000,000.');
  });

  it('mensajes fijos para conexión, permisos y límite de solicitudes', () => {
    expect(mensajeError(error(0, null))).toContain('No se pudo conectar');
    expect(mensajeError(error(403, 'detalle interno'))).toBe('No tiene permisos para realizar esta operación.');
    expect(mensajeError(error(429, null))).toContain('Demasiadas solicitudes');
    expect(mensajeError(error(500, null), 'Por defecto')).toBe('Por defecto');
  });

  it('deduce el tipo de aviso del texto', () => {
    expect(tipoDeMensaje('Cliente guardado correctamente.')).toBe('success');
    expect(tipoDeMensaje('No se pudo guardar.')).toBe('error');
    expect(tipoDeMensaje('Selecciona un vehículo.')).toBe('warning');
  });

  it('usa SweetAlert2 (no alert/confirm nativos) y enfoca "Cancelar" en acciones destructivas', async () => {
    const fire = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false } as never);
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    await notificar('Hecho correctamente.', 'success');
    expect(await confirmar('¿Eliminar?', { peligroso: true })).toBe(true);

    expect(fire).toHaveBeenCalledTimes(2);
    expect(fire.mock.calls[1][0]).toMatchObject({ focusCancel: true, showCancelButton: true });
    expect(alerta).not.toHaveBeenCalled();
    fire.mockRestore();
    alerta.mockRestore();
  });
});
