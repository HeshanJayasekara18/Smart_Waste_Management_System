import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';

const navigation = [
  { name: 'Dashboard', href: '/municipal/dashboard', icon: HomeIcon, current: true },
  {
    name: 'Waste Management',
    icon: DeleteIcon,
    current: false,
    children: [
      { name: 'Collections', href: '/municipal/collections' },
      { name: 'Schedules', href: '/municipal/schedules' },
      { name: 'Categories', href: '/municipal/categories' },
    ],
  },
  { name: 'Residents', href: '/municipal/residents', icon: PeopleIcon, current: false },
  { name: 'Reports', href: '/municipal/reports', icon: DescriptionIcon, current: false },
  { name: 'Analytics', href: '/municipal/analytics', icon: AssessmentIcon, current: false },
  { name: 'Complaints', href: '/municipal/complaints', icon: ListAltIcon, current: false },
  { name: 'Calendar', href: '/municipal/calendar', icon: EventIcon, current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MunicipalSidebar = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white border-r border-gray-200">
      <div className="flex flex-col flex-1">
        <div className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Municipal Admin</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 pb-4 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {!item.children ? (
                <Link
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150'
                  )}
                >
                  <item.icon
                    className={classNames(
                      location.pathname === item.href ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={classNames(
                      'w-full text-left flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md',
                      expandedMenus[item.name] 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={classNames(
                          expandedMenus[item.name] ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </div>
                    {expandedMenus[item.name] ? (
                      <ExpandMoreIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {expandedMenus[item.name] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={classNames(
                            location.pathname === subItem.href
                              ? 'text-emerald-700 font-medium'
                              : 'text-gray-600 hover:text-gray-900',
                            'block px-3 py-1.5 text-sm rounded-md hover:bg-gray-50 transition-colors duration-150'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3
         bg-gradient-to-r from-emerald-50 to-white p-3 rounded-lg">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <SettingsIcon style={{ height: '1.25rem', width: '1.25rem', color: '#059669' }} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Settings</p>
            <p className="text-xs text-gray-500">Customize your preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MunicipalSidebar;
