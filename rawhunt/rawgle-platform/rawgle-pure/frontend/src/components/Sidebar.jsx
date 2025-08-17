import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  HeartIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Pets', href: '/pets', icon: HeartIcon },
  { name: 'Feeding Tracker', href: '/feeding', icon: CameraIcon },
  { name: 'AI Health Consult', href: '/ai-medical', icon: ChatBubbleLeftRightIcon },
  { name: 'PAWS Wallet', href: '/paws', icon: CurrencyDollarIcon },
  { name: 'NFT Gallery', href: '/nfts', icon: PhotoIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full pt-16">
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'nav-link-active'
                        : 'nav-link'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive
                          ? 'text-primary-500'
                          : 'text-gray-400 group-hover:text-primary-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;