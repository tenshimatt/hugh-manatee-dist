import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateEmail, truncateAddress } from '../utils/helpers';

const SettingsPage = () => {
  const { user, linkWallet } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    feeding_reminders: true,
    health_alerts: true,
    paws_updates: false,
    marketing: false,
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'password', name: 'Password', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'subscription', name: 'Subscription', icon: CreditCardIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
  ];

  const showMessage = (type, content) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: '', content: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      showMessage('error', 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnection = async () => {
    try {
      // Mock wallet connection - integrate with actual Solana wallet
      const mockWalletAddress = 'So11111111111111111111111111111111111111112';
      const result = await linkWallet(mockWalletAddress);
      
      if (result.success) {
        showMessage('success', 'Wallet connected successfully!');
      } else {
        showMessage('error', result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      showMessage('error', 'Wallet connection failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      {message.content && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.content}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="card p-4">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 input-field"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 input-field"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 input-field"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center"
                  >
                    {isLoading && <LoadingSpinner size="sm" color="white" />}
                    <span className="ml-2">Update Profile</span>
                  </button>
                </div>
              </form>

              {/* Wallet Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Solana Wallet</h3>
                {user?.wallet_address ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">Wallet Connected</p>
                      <p className="text-sm text-green-600">{truncateAddress(user.wallet_address)}</p>
                    </div>
                    <button className="btn-secondary text-sm">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-600 mb-4">
                      Connect your Solana wallet to enable NFT features and blockchain rewards.
                    </p>
                    <button
                      onClick={handleWalletConnection}
                      className="btn-primary"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    className="mt-1 input-field"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    className="mt-1 input-field"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    className="mt-1 input-field"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center"
                  >
                    {isLoading && <LoadingSpinner size="sm" color="white" />}
                    <span className="ml-2">Change Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {key === 'feeding_reminders' && 'Get reminded about feeding times'}
                        {key === 'health_alerts' && 'Receive alerts about health concerns'}
                        {key === 'paws_updates' && 'Updates about PAWS earnings and rewards'}
                        {key === 'marketing' && 'Marketing emails and promotional content'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button className="btn-primary">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Subscription Management</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Free Plan</h3>
                    <p className="text-sm text-gray-600">Basic pet care tracking</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">$0/month</span>
                </div>
              </div>

              <h3 className="font-medium text-gray-900 mb-4">Upgrade Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Premium</h4>
                  <p className="text-2xl font-bold text-gray-900 mb-2">$9.99<span className="text-sm font-normal">/month</span></p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Unlimited pets</li>
                    <li>• 2x PAWS earnings</li>
                    <li>• Advanced analytics</li>
                    <li>• Priority support</li>
                  </ul>
                  <button className="btn-primary w-full">Upgrade to Premium</button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Enterprise</h4>
                  <p className="text-2xl font-bold text-gray-900 mb-2">$29.99<span className="text-sm font-normal">/month</span></p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Everything in Premium</li>
                    <li>• 5x PAWS earnings</li>
                    <li>• Vet collaboration</li>
                    <li>• API access</li>
                  </ul>
                  <button className="btn-primary w-full">Upgrade to Enterprise</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Data Privacy</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Control how your data is used and shared.
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Allow analytics for service improvement</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">Share anonymized data with researchers</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Account Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-700">Two-factor authentication</span>
                      <button className="btn-secondary text-sm">Enable</button>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-700">Download your data</span>
                      <button className="btn-secondary text-sm">Request</button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                  <div className="border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Once you delete your account, there is no going back. This will permanently delete all your data.
                    </p>
                    <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;