import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { login, setUserRole, setUsername } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('operator123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);

      if (success) {
        // Fetch user details
        try {
          const response = await apiClient.client.get('/users/');
          // Handle both paginated and non-paginated responses
          const users = Array.isArray(response.data) ? response.data : (response.data.results || []);

          let user = users.find((u: any) => u.username === username);

          // Fallback: If we can't find the user object (e.g. absent from first page), 
          // we still validly logged in. Use the form username. 
          // Note: Role defaults to GUEST if not found, unless we have a 'me' endpoint.
          // Since we fixed the backend seed, 'admin' should be found. 
          // If not found, we will at least save the username.

          if (user) {
            setUserRole(user.role);
            setUsername(user.username);
          } else {
            // Fallback for role if known username (demo purposes)
            if (username === 'admin') setUserRole('ADMIN');
            else if (username === 'operator') setUserRole('OPERATOR');
            else if (username === 'analyst') setUserRole('ANALYST');

            setUsername(username);
          }
        } catch (e) {
          console.error('Failed to fetch user details', e);
          // Fallback on error
          setUsername(username);
          if (username === 'admin') setUserRole('ADMIN');
        }

        router.push('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-md w-full px-6 relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
             <span className="text-3xl font-bold text-primary tracking-tighter">SR</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">SkyRecon</h2>
          <p className="text-textMuted text-sm tracking-wide uppercase font-semibold">Mission Control Authentication</p>
        </div>

        <div className="glass-panel p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-textMuted uppercase mb-2 tracking-wider">
                Operator ID
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                placeholder="Enter your ID"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-textMuted uppercase mb-2 tracking-wider">
                Security Passkey
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm font-medium flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-danger mr-2 animate-pulse"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-bold tracking-wide hover:bg-blue-600 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-[0.98] mt-4"
            >
              {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AUTHENTICATING...
                  </span>
              ) : 'INITIALIZE UPLINK'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="text-xs text-textMuted uppercase font-bold tracking-widest mb-4 text-center">Authorized Personnel Only</div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded text-center border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => { setUsername('operator'); setPassword('operator123'); }}>
                    <div className="text-white text-xs font-bold mb-1">OPERATOR</div>
                    <div className="text-[10px] font-mono text-textMuted">operator / operator123</div>
                </div>
                <div className="bg-white/5 p-3 rounded text-center border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
                    <div className="text-white text-xs font-bold mb-1">COMMANDER</div>
                    <div className="text-[10px] font-mono text-textMuted">admin / admin123</div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
