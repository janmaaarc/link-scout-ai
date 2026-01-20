import React, { useState, useEffect } from 'react';
import { ScanSearch, Lock, User, ArrowRight, Loader2, AlertCircle, Clock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

// Get credentials from environment variables or use defaults for development
const getCredentials = () => {
  return {
    username: import.meta.env.VITE_AUTH_USERNAME || 'admin',
    password: import.meta.env.VITE_AUTH_PASSWORD || 'admin'
  };
};

// Rate limiting constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60; // seconds

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Load failed attempts from session storage
  useEffect(() => {
    const storedAttempts = sessionStorage.getItem('login_attempts');
    const storedLockout = sessionStorage.getItem('login_lockout');

    if (storedAttempts) {
      setFailedAttempts(parseInt(storedAttempts, 10));
    }
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        sessionStorage.removeItem('login_lockout');
        sessionStorage.removeItem('login_attempts');
      }
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutRemaining(0);
        setFailedAttempts(0);
        sessionStorage.removeItem('login_lockout');
        sessionStorage.removeItem('login_attempts');
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    if (lockoutUntil && lockoutUntil > Date.now()) {
      setError(`Too many failed attempts. Try again in ${lockoutRemaining} seconds.`);
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));

    const credentials = getCredentials();

    if (username === credentials.username && password === credentials.password) {
      // Reset attempts on successful login
      sessionStorage.removeItem('login_attempts');
      sessionStorage.removeItem('login_lockout');
      onLogin();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      sessionStorage.setItem('login_attempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + (LOCKOUT_DURATION * 1000);
        setLockoutUntil(lockoutTime);
        setLockoutRemaining(LOCKOUT_DURATION);
        sessionStorage.setItem('login_lockout', lockoutTime.toString());
        setError(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION} seconds.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      }
      setIsLoading(false);
    }
  };

  const isLockedOut = lockoutUntil !== null && lockoutUntil > Date.now();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ScanSearch className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          LinkScout AI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Vanguard Ops • Autonomous Lead Gen
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl sm:px-10 border border-gray-100 dark:border-gray-700 transition-colors">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg py-2.5 border outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg py-2.5 border outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || isLockedOut}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isLockedOut ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Locked ({lockoutRemaining}s)
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                  Protected System
                </span>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
              <p>Authorized personnel only. All activities are logged.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};