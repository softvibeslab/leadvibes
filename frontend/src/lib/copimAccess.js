const COPIM_TENANT_TYPES = new Set(['copim', 'council', 'association']);
const COPIM_ASSOCIATION_ROLES = new Set(['copim_admin', 'copim_operator']);
const COPIM_NATIONAL_ROLES = new Set(['copim_admin']);
const ROVI_INTERNAL_ROLES = new Set(['rovi_admin', 'rovi_sales', 'rovi_marketing', 'rovi_customer_success', 'rovi_ops']);

export const isCopimRole = (role) => (
  typeof role === 'string' && role.startsWith('copim')
);

export const isRoviInternalRole = (role) => ROVI_INTERNAL_ROLES.has(role);

export const getEffectiveRole = (user) => (
  user?.active_workspace?.role || user?.role || 'broker'
);

export const isCopimAccount = (user) => (
  user?.account_type === 'copim' || isCopimRole(user?.role)
);

export const isCopimMemberUser = (user) => getEffectiveRole(user) === 'copim_member';
export const isCopimNationalUser = (user) => COPIM_NATIONAL_ROLES.has(getEffectiveRole(user));
export const isCopimLocalAssociationUser = (user) => getEffectiveRole(user) === 'copim_operator';
export const isRoviInternalUser = (user) => (
  user?.account_type === 'rovi_internal' ||
  user?.active_workspace?.tenant_type === 'rovi_internal' ||
  isRoviInternalRole(getEffectiveRole(user))
);

export const canManageCopimWorkspace = (user) => COPIM_ASSOCIATION_ROLES.has(getEffectiveRole(user));

export const hasCopimWorkspace = (user) => (
  Array.isArray(user?.available_workspaces) &&
  user.available_workspaces.some((workspace) => COPIM_TENANT_TYPES.has(workspace?.tenant_type))
);

export const canAccessCopim = (user) => (
  isCopimAccount(user) || hasCopimWorkspace(user)
);

export const resolveAppModeForUser = (user, preferredMode = 'rovi') => {
  if (!canAccessCopim(user)) {
    return 'rovi';
  }

  if (isCopimAccount(user) || isCopimMemberUser(user)) {
    return 'copim';
  }

  return preferredMode === 'copim' ? 'copim' : 'rovi';
};

export const resolveAuthenticatedHome = (user, preferredMode = 'rovi') => {
  if (isRoviInternalUser(user)) {
    return '/rovi/dashboard';
  }

  if (isCopimMemberUser(user)) {
    return '/copim/member';
  }

  if (isCopimLocalAssociationUser(user)) {
    return '/copim/association/profile';
  }

  if (isCopimNationalUser(user)) {
    return '/copim/dashboard';
  }

  return resolveAppModeForUser(user, preferredMode) === 'copim' ? '/copim/dashboard' : '/dashboard';
};

export const getAccountTypeLabel = (accountType, appMode = 'rovi') => {
  if (accountType === 'rovi_internal') {
    return 'ROVI Internal';
  }
  if (accountType === 'copim_member') {
    return 'Portal del asociado';
  }
  if (appMode === 'copim' || accountType === 'copim') {
    return 'Institucional';
  }
  if (accountType === 'agency') {
    return 'Inmobiliaria';
  }
  return 'Broker';
};

export const getWorkspaceTypeLabel = (tenantType) => {
  if (tenantType === 'rovi_internal') {
    return 'ROVI Internal';
  }
  if (tenantType === 'copim') {
    return 'COPIM';
  }
  if (tenantType === 'council') {
    return 'Consejo';
  }
  if (tenantType === 'association') {
    return 'Asociacion';
  }
  if (tenantType === 'agency') {
    return 'Inmobiliaria';
  }
  return 'Personal';
};

export const getRoleLabel = (role) => {
  if (!role) {
    return 'broker';
  }

  const labels = {
    broker: 'Broker',
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    copim_admin: 'COPIM Nacional',
    copim_operator: 'Asociacion local',
    copim_member: 'Asociado',
    rovi_admin: 'ROVI Admin',
    rovi_sales: 'ROVI Sales',
    rovi_marketing: 'ROVI Marketing',
    rovi_customer_success: 'Customer Success',
    rovi_ops: 'ROVI Ops',
  };

  return labels[role] || role.replaceAll('_', ' ');
};

export const getVisibleWorkspaces = (user) => {
  const workspaces = Array.isArray(user?.available_workspaces) ? user.available_workspaces : [];
  if (!isCopimMemberUser(user)) {
    return workspaces;
  }

  return workspaces.filter((workspace) => workspace?.role === 'copim_member');
};
