const MENUVIBES_TYPE = 'menuvibes';

export const getMenuVibesWorkspace = (user) => user?.active_workspace || null;

// Runtime access is determined by the active workspace. account_type is only a
// bootstrap fallback while an authenticated session has not loaded workspaces.
export const isMenuVibesAccount = (user) => {
  const workspace = getMenuVibesWorkspace(user);
  if (workspace) {
    return workspace.tenant_type === MENUVIBES_TYPE;
  }
  return user?.account_type === MENUVIBES_TYPE;
};

export const getMenuVibesRole = (user) => (
  isMenuVibesAccount(user)
    ? (getMenuVibesWorkspace(user)?.role || user?.role || null)
    : null
);

export const canManageMenuVibes = (user) => (
  ['owner', 'manager'].includes(getMenuVibesRole(user))
);

export const getMenuVibesRoleLabel = (user) => ({
  owner: 'Owner',
  manager: 'Líder',
  executive: 'Ejecutivo',
}[getMenuVibesRole(user)] || 'Miembro');

export const getMenuVibesHome = () => '/menuvibes/dashboard';

export const resolveMenuVibesHome = (user, fallback = '/dashboard') => (
  isMenuVibesAccount(user) ? getMenuVibesHome() : fallback
);
