export const guestAllowedPaths = new Set(['/dashboard', '/profile']);

export const appNavLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/deliveries', label: 'Deliveries', guestVisible: false, permission: 'orders:read' },
  { to: '/deliveries/history', label: 'History', guestVisible: false, permission: 'orders:read' },
  { to: '/labor', label: 'Labor & Crew', guestVisible: false, permission: 'labor:read' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings', guestVisible: true },
];
