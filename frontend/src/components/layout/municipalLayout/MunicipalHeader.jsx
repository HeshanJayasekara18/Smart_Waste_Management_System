import React from 'react';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import logo from "../../../assets/images/logo.png";

const MunicipalHeader = () => {
  return (
    <header className="bg-gradient-to-r from-green-600 my-[-12px] mx-[-32px] to-emerald-700 text-white shadow-lg">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 py-4 border-b">
          <h2 className="text-3xl font-semibold text-white ">TrashTrack</h2>
        </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="relative rounded-full bg-emerald-700 p-1 text-emerald-100 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-700"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <NotificationsNoneIcon style={{ height: '1.5rem', width: '1.5rem' }} />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div className="relative ml-3">
              <div className="flex items-center space-x-2 cursor-pointer">
                <AccountCircleIcon style={{ height: '2rem', width: '2rem', color: 'white' }} />
                <span className="text-sm font-medium">Municipal Admin</span>
              </div>
            </div>

            <button
              type="button"
              className="rounded-full p-1 text-emerald-100 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-700"
            >
              <span className="sr-only">Settings</span>
              <SettingsIcon style={{ height: '1.5rem', width: '1.5rem' }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MunicipalHeader;
