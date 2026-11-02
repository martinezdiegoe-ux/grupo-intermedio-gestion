import type { AppUser } from '../types/domain'

export function isCollaborator(user: AppUser | null) {
  return user?.role === 'collaborator'
}
export function canManageProjects(user: AppUser | null) {
  return !!user && !isCollaborator(user) && (user.role === 'admin' || user.role === 'superadmin' || user.permissions.includes('projects.write'))
}
export function canOpenPath(user: AppUser | null, path: string) {
  if (!user || user.active === false) return false
  if (!isCollaborator(user)) return true
  return ['/asistencia', '/cronograma', '/proyectos', '/avisos'].some(base => path === base || (base === '/proyectos' && /^\/proyectos\/[^/]+$/.test(path)))
}
