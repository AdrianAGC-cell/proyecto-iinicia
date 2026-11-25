import type { Role } from '../types';

export const nombresRoles: Record<Role, string> = {
  superadmin: 'Superadministrador',
  admin_tecnico: 'Administrador técnico',
  admin_academico: 'Administrador académico',
  coordinador: 'Coordinador',
  profesor: 'Profesor',
  estudiante: 'Estudiante',
  aspirante: 'Aspirante',
  soporte: 'Soporte',
  admin: 'Administrador legado'
};

export const rolesAdministrativos: Role[] = [
  'superadmin',
  'admin_tecnico',
  'admin_academico',
  'coordinador',
  'soporte'
];

export function rutaPorRol(rol: Role): string {
  if (rolesAdministrativos.includes(rol)) {
    return '/admin';
  }

  if (rol === 'aspirante') {
    return '/admisiones';
  }

  if (rol === 'profesor' || rol === 'estudiante') {
    return '/mi-iinicia';
  }

  return '/';
}
