export const guestAllowedPaths = new Set(['/dashboard', '/profile']);

export const appNavLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/deliveries', label: 'Deliveries', guestVisible: false },
  { to: '/deliveries/history', label: 'History', guestVisible: false },
  { to: '/labor', label: 'Labor & Crew', guestVisible: false },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings', guestVisible: false },
];
