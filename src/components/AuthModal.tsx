import React, { useState } from 'react';
import { UserProfile, Task, WorkTemplate, UserSettings } from '../types';
import { X, User, Mail, Lock, LogIn, UserPlus, Cloud, Check, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (
    user: UserProfile,
    syncedData?: {
      tasks?: Task[];
      templates?: WorkTemplate[];
      settings?: UserSettings | null;
      pomodoroCount?: number;
    }
  ) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill out all fields');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering
      ? { name: name.trim(), email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || 'Server returned an invalid response' };
      }

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Save token to localStorage
      if (data.token) {
        localStorage.setItem('pomofocus_jwt_token', data.token);
      }

      const profile: UserProfile = {
        name: data.user.name,
        email: data.user.email,
        isLoggedIn: true,
        token: data.token,
      };

      onLoginSuccess(profile, data.data);
      setError('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-gray-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        {currentUser.isLoggedIn ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <p className="text-sm text-gray-500 mb-6">{currentUser.email}</p>
            
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-6 text-sm text-left">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                <Cloud size={16} className="text-emerald-600" />
                <span>Multi-System Cloud Sync Active</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your tasks, custom timings, and work templates automatically save to the database. Log in from any other computer, laptop, or phone to access your exact workspace!
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('pomofocus_jwt_token');
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-98"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Cloud size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isRegistering ? 'Create your Account' : 'Sign in to Sync'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Sync tasks, timers, and templates across all your computers
              </p>
            </div>

            {error && (
              <div className="mb-4 text-xs bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
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
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
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
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
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
                disabled={loading}
                className="w-full py-3 bg-red-500 hover:bg-red-600 active:scale-98 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isRegistering ? (
                  <UserPlus size={18} />
                ) : (
                  <LogIn size={18} />
                )}
                <span>
                  {loading
                    ? 'Connecting to database...'
                    : isRegistering
                    ? 'Create Account & Enable Sync'
                    : 'Sign In & Sync'}
                </span>
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-red-500 font-bold hover:underline"
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
