const navDefinitions = [
  {
    label: 'Dashboard',
    badge: null,
    path: '/',
    match: (currentPath) => currentPath === '/',
  },
  {
    label: 'My Bills',
    badge: '3',
    path: '#',
    match: () => false,
  },
  {
    label: 'Payment Methods',
    badge: null,
    path: '/payments/select',
    match: (currentPath) =>
      currentPath === '/payments/select' ||
      currentPath.startsWith('/payments/card') ||
      currentPath.startsWith('/payments/otp') ||
      currentPath.startsWith('/payments/offline') ||
      currentPath.startsWith('/payments/success'),
  },
  {
    label: 'Receipt & History',
    badge: null,
    path: '/payments/history',
    match: (currentPath) => currentPath.startsWith('/payments/history'),
  },
  {
    label: 'Setting',
    badge: null,
    path: '#',
    match: () => false,
  },
];

export function getNavItems(currentPath) {
  return navDefinitions.map((definition) => ({
    label: definition.label,
    badge: definition.badge,
    path: definition.path,
    active: definition.match(currentPath),
    disabled: definition.path === '#',
  }));
}

export default getNavItems;
