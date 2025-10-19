import React, { useState } from 'react';
import { Settings, Bell, Lock, User, LogOut, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('account');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    updates: false,
  });
  const [twoFactor, setTwoFactor] = useState(false);

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-gray-400 mt-2">Manage your account and preferences</p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-800 px-6 py-8">
            <div className="space-y-2">
              <button
                onClick={() => setActiveSection('account')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeSection === 'account'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account
                  </div>
                  {activeSection === 'account' && <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              <button
                onClick={() => setActiveSection('notifications')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeSection === 'notifications'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </div>
                  {activeSection === 'notifications' && <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              <button
                onClick={() => setActiveSection('security')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeSection === 'security'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Security
                  </div>
                  {activeSection === 'security' && <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <button className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/20 transition-colors flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-8 py-8">
            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="user@example.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      defaultValue="Company Inc."
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg mt-6">
                    <p className="text-sm text-blue-300 mb-4">Subscription Status</p>
                    <p className="text-lg font-semibold text-white mb-2">Active</p>
                    <p className="text-sm text-gray-400">Your subscription remains active. No action needed.</p>
                  </div>
                </div>

                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Email Notifications</h3>
                      <p className="text-sm text-gray-400">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={() => handleNotificationChange('email')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Push Notifications</h3>
                      <p className="text-sm text-gray-400">Receive real-time alerts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.push}
                        onChange={() => handleNotificationChange('push')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Product Updates</h3>
                      <p className="text-sm text-gray-400">Get notified about new features</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.updates}
                        onChange={() => handleNotificationChange('updates')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">
                  Save Preferences
                </button>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Security Settings</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <h3 className="font-medium text-white mb-4">Change Password</h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={twoFactor}
                        onChange={() => setTwoFactor(!twoFactor)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <h3 className="font-medium text-white mb-4">Active Sessions</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>Current browser - Your device</p>
                      <button className="text-blue-400 hover:text-blue-300">Sign out other sessions</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}