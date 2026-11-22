const lead = ['orders:read', 'orders:update', 'dispatch:read', 'tracking:publish', 'labor:read', 'labor:update'];
const regionalAdmin = [...lead, 'users:read', 'orders:create', 'reports:export'];
const operationsAdmin = [...regionalAdmin, 'users:create', 'dispatch:override', 'tracking:view_all'];

export const roleDefinitions = {
  'Super Admin': { inherits: [], permissions: ['*:*'] },
  Admin: { inherits: [], permissions: ['*:*'] },
  OperationsAdmin: { inherits: [], permissions: operationsAdmin },
  RegionalAdmin: { inherits: [], permissions: regionalAdmin },
  Lead: { inherits: [], permissions: lead },
  User: { inherits: [], permissions: ['tracking:read_own'] },
  Guest: { inherits: [], permissions: [] },
};

export function permissionsFor(role, assigned = [], seen = new Set()) {
  if (seen.has(role)) return [];
  seen.add(role);
  const definition = roleDefinitions[role];
  if (!definition) return assigned;
  return [...new Set([...definition.permissions, ...definition.inherits.flatMap(parent => permissionsFor(parent, [], seen)), ...assigned])];
}

export function hasPermission(role, permission, assigned = []) {
  const effective = permissionsFor(role, assigned);
  return effective.includes('*:*') || effective.includes(permission);
}

export function hasRegionAccess(role, userRegions = [], resourceRegion) {
  if (role === 'Admin' || role === 'Super Admin' || permissionsFor(role).includes('*:*')) return true;
  return Boolean(resourceRegion && (userRegions.includes('*') || userRegions.includes(resourceRegion)));
}
