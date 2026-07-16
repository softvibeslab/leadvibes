import {
  canManageMenuVibes,
  getMenuVibesRole,
  getMenuVibesRoleLabel,
  isMenuVibesAccount,
  resolveMenuVibesHome,
} from './menuvibesAccess';

describe('menuvibesAccess', () => {
  test('uses the active workspace as runtime authority', () => {
    const user = {
      account_type: 'menuvibes',
      role: 'owner',
      active_workspace: { tenant_type: 'individual', role: 'owner' },
    };
    expect(isMenuVibesAccount(user)).toBe(false);
    expect(resolveMenuVibesHome(user, '/dashboard')).toBe('/dashboard');
  });

  test('recognizes an invited user inside a MenuVibes workspace', () => {
    const user = {
      account_type: 'individual',
      role: 'broker',
      active_workspace: { tenant_type: 'menuvibes', role: 'executive' },
    };
    expect(isMenuVibesAccount(user)).toBe(true);
    expect(getMenuVibesRole(user)).toBe('executive');
    expect(canManageMenuVibes(user)).toBe(false);
    expect(resolveMenuVibesHome(user)).toBe('/menuvibes/dashboard');
  });

  test('allows only owner and manager to manage MenuVibes', () => {
    const withRole = (role) => ({ active_workspace: { tenant_type: 'menuvibes', role } });
    expect(canManageMenuVibes(withRole('owner'))).toBe(true);
    expect(canManageMenuVibes(withRole('manager'))).toBe(true);
    expect(canManageMenuVibes(withRole('admin'))).toBe(false);
    expect(canManageMenuVibes(withRole('executive'))).toBe(false);
  });

  test('presents the manager role as Líder only in MenuVibes', () => {
    const withRole = (role) => ({ active_workspace: { tenant_type: 'menuvibes', role } });
    expect(getMenuVibesRoleLabel(withRole('manager'))).toBe('Líder');
    expect(getMenuVibesRoleLabel(withRole('executive'))).toBe('Ejecutivo');
  });
});
