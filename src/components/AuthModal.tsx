import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill out all fields');
      return;
    }

    // Save/Authenticate to localStorage demo user system
    const profile: UserProfile = {
      name: isRegistering ? name : (email.split('@')[0] || 'User'),
      email,
      isLoggedIn: true,
    };

    onLogin(profile);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-gray-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        {currentUser.isLoggedIn ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <p className="text-sm text-gray-500 mb-6">{currentUser.email}</p>
            <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-left border border-gray-100">
              <p className="font-semibold text-gray-700">Account status:</p>
              <p className="text-green-600 font-medium">✓ Logged In (Syncing all tasks & reports)</p>
            </div>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-md active:scale-98"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <User size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isRegistering ? 'Create your Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Save your daily work, pomodoros & templates
              </p>
            </div>

            {error && (
              <div className="mb-4 text-xs bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-500 hover:bg-red-600 active:scale-98 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                <span>{isRegistering ? 'Create Account' : 'Log In'}</span>
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-red-500 font-semibold hover:underline"
              >
                {isRegistering ? 'Log in here' : 'Sign up for free'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

