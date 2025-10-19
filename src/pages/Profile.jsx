import React, { useState, useEffect } from 'react';
import { UserCircleIcon, ShieldCheckIcon, EnvelopeIcon, CalendarIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      setFormData({ ...formData, name: userData.name, email: userData.email });
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = () => {
    setMessage({ type: 'success', text: '✅ Profil mis à jour avec succès !' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '❌ Les mots de passe ne correspondent pas' });
      return;
    }
    setMessage({ type: 'success', text: '✅ Mot de passe modifié avec succès !' });
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordChange(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const formattedDate = new Date(user.createdAt || Date.now()).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
          <div className="px-8 pb-8 -mt-16">
            <div className="flex items-end space-x-6">
              <div className="relative">
                {user.role === 'root' ? (
                  <ShieldCheckIcon className="h-32 w-32 text-emerald-400 bg-gray-800 rounded-full p-4 border-4 border-gray-800 shadow-xl" />
                ) : (
                  <UserCircleIcon className="h-32 w-32 text-gray-400 bg-gray-800 rounded-full p-4 border-4 border-gray-800 shadow-xl" />
                )}
                <div className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-gray-800 ${user.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
              <div className="flex-1 pb-4">
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-gray-400 mt-1">{user.email}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'root' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'}`}>
                    {user.role === 'root' ? '👑 Super Administrateur' : '🔧 Administrateur'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/50">
  ● Actif
</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Adresse email</h3>
            </div>
            <p className="text-gray-300">{user.email}</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <CalendarIcon className="h-6 w-6 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Membre depuis</h3>
            </div>
            <p className="text-gray-300">{formattedDate}</p>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Informations personnelles</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom complet</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Enregistrer les modifications
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Nom complet</p>
                <p className="text-white font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Adresse email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <KeyIcon className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Changer le mot de passe</h2>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {showPasswordChange ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {showPasswordChange && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <KeyIcon className="h-5 w-5" />
                Modifier le mot de passe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}