import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 relative py-12">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-brand-500 blur-[80px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] rounded-full bg-indigo-500 blur-[90px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-left">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xl shadow-lg shadow-brand-500/20 mb-4">
              C
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Log in to borrow, share, and connect</p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                College Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campushare.edu"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg hover:shadow-lg hover:shadow-brand-500/25 rounded-2xl disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Seed accounts helper hint */}
          <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Demo logins: <strong className="text-slate-600 dark:text-slate-400">aarav@campushare.edu</strong> or <strong className="text-slate-600 dark:text-slate-400">admin@campushare.edu</strong><br/>
              Password: <strong className="text-slate-600 dark:text-slate-400">password123</strong> (admin is <strong className="text-slate-600 dark:text-slate-400">admin123</strong>)
            </p>
          </div>

          <div className="text-center mt-6 text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
