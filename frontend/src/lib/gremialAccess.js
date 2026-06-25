const GREMIAL_TENANT_TYPES = new Set(['gremial', 'chamber', 'delegation', 'member_company']);
const GREMIAL_NATIONAL_ROLES = new Set(['gremial_national_admin', 'gremial_finance', 'gremial_training_manager', 'gremial_communications']);
const GREMIAL_DELEGATION_ROLES = new Set(['gremial_delegation_admin', 'gremial_membership_manager']);
const GREMIAL_MEMBER_ROLES = new Set(['gremial_member_admin', 'gremial_member_user']);
const COPIM_TO_GREMIAL_ROLE = {
  copim_admin: 'gremial_national_admin',
  copim_operator: 'gremial_delegation_admin',
  copim_member: 'gremial_member_user',
};

export const getGremialEffectiveRole = (user) => {
  const role = user?.active_workspace?.role || user?.role || '';
  return COPIM_TO_GREMIAL_ROLE[role] || role;
};

export const isGremialRole = (role) => {
  const normalized = COPIM_TO_GREMIAL_ROLE[role] || role;
  return GREMIAL_NATIONAL_ROLES.has(normalized) || GREMIAL_DELEGATION_ROLES.has(normalized) || GREMIAL_MEMBER_ROLES.has(normalized);
};

export const isGremialAccount = (user) => {
  const accountType = user?.account_type;
  const tenantType = user?.active_workspace?.tenant_type;
  return GREMIAL_TENANT_TYPES.has(accountType) || GREMIAL_TENANT_TYPES.has(tenantType) || isGremialRole(user?.role) || isGremialRole(user?.active_workspace?.role);
};

export const isGremialNationalUser = (user) => GREMIAL_NATIONAL_ROLES.has(getGremialEffectiveRole(user));
export const isGremialDelegationUser = (user) => GREMIAL_DELEGATION_ROLES.has(getGremialEffectiveRole(user));
export const isGremialMemberUser = (user) => GREMIAL_MEMBER_ROLES.has(getGremialEffectiveRole(user));

export const canManageGremialWorkspace = (user) => isGremialNationalUser(user) || isGremialDelegationUser(user);

export const getGremialHome = (user) => {
  if (isGremialMemberUser(user)) return '/gremial/member';
  if (isGremialDelegationUser(user)) return '/gremial/dashboard';
  if (isGremialNationalUser(user)) return '/gremial/dashboard';
  return '/dashboard';
};

export const getGremialWorkspaceTypeLabel = (tenantType) => ({
  gremial: 'Gremial',
  chamber: 'Cámara',
  delegation: 'Delegación',
  member_company: 'Empresa afiliada',
}[tenantType] || 'Workspace');

export const getGremialRoleLabel = (role) => ({
  gremial_national_admin: 'Nacional',
  gremial_delegation_admin: 'Delegación',
  gremial_membership_manager: 'Afiliación',
  gremial_finance: 'Finanzas',
  gremial_training_manager: 'Capacitación',
  gremial_communications: 'Comunicación',
  gremial_member_admin: 'Afiliado admin',
  gremial_member_user: 'Afiliado',
  copim_admin: 'Nacional',
  copim_operator: 'Delegación',
  copim_member: 'Afiliado',
}[role] || role || 'Usuario');
