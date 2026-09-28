import { useEffect, useState } from 'react';
import { apiUrl, getAuthHeaders } from './lib/api';

const defaultForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
};

function App() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(defaultForm);
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: getAuthHeaders(authToken),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      setUser(data.data);
    } catch {
      setToken('');
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- This call starts an async request; state changes occur after the response.
      fetchCurrentUser(token);
    }
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const payload =
        mode === 'login'
          ? {
              email: form.email || form.username,
              username: form.username || '',
              password: form.password,
            }
          : {
              fullName: form.fullName,
              username: form.username,
              email: form.email,
              password: form.password,
            };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      const accessToken = data.data?.token;
      if (!accessToken) {
        throw new Error('Token not returned by backend');
      }

      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setSuccess(mode === 'login' ? 'Logged in successfully!' : 'Account created successfully!');
      setForm(defaultForm);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setToken('');
    setUser(null);
    setSuccess('Logged out successfully');
  };

  const dashboardCards = [
    { label: 'Courses', value: '8', tone: 'bg-indigo-500/15 text-indigo-700' },
    { label: 'Timetable', value: '5 slots', tone: 'bg-emerald-500/15 text-emerald-700' },
    { label: 'Todo', value: '12 tasks', tone: 'bg-amber-500/15 text-amber-700' },
    { label: 'Motivation', value: '3 notes', tone: 'bg-pink-500/15 text-pink-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!token || !user ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Resources & Schedule</p>
              <h1 className="mt-3 text-3xl font-bold">Welcome back</h1>
            </div>

            <div className="mb-6 flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white"
                    placeholder="John Doe"
                    required={mode === 'register'}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {mode === 'login' ? 'Email or username' : 'Username'}
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white"
                  placeholder={mode === 'login' ? 'you@example.com or username' : 'your_username'}
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white"
                    placeholder="you@example.com"
                    required={mode === 'register'}
                  />
                </div>
              )}

              {mode === 'login' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              {success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <header className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-300/30 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Dashboard</p>
                <h2 className="mt-2 text-2xl font-bold">Hello, {user.fullName || user.email}</h2>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Logout
              </button>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map((card) => (
                <div key={card.label} className={`rounded-2xl border border-slate-200 p-5 ${card.tone}`}>
                  <p className="text-sm font-medium">{card.label}</p>
                  <p className="mt-3 text-2xl font-bold">{card.value}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Current Courses</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="rounded-xl bg-slate-50 px-3 py-2">Machine Learning</li>
                  <li className="rounded-xl bg-slate-50 px-3 py-2">Data Structures</li>
                  <li className="rounded-xl bg-slate-50 px-3 py-2">Operating Systems</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Today</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="rounded-xl bg-indigo-50 px-3 py-2">9:00 AM - Algorithms</li>
                  <li className="rounded-xl bg-emerald-50 px-3 py-2">1:00 PM - Design Review</li>
                  <li className="rounded-xl bg-amber-50 px-3 py-2">5:00 PM - Assignment Deadline</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Motivation</h3>
                <blockquote className="mt-4 rounded-2xl bg-pink-50 p-4 text-sm text-pink-700">
                  “Success is the sum of small efforts, repeated day in and day out.”
                </blockquote>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
