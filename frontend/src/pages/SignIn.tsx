import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!email.trim() || !password.trim()) return;

  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  try {
    const res = await fetch('http://localhost:8000/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json();
    console.log('🟡 /token response:', data); // 🔍 DEBUG: login API response

    if (!res.ok) {
      console.warn('⚠️ Login failed:', data);
      setError(data.detail || 'Login failed');
      return;
    }

    localStorage.setItem('token', data.access_token);

    const profileRes = await fetch('http://localhost:8000/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const user = await profileRes.json();
    console.log('🟢 /me response:', user); // 🔍 DEBUG: user info

    if (!profileRes.ok) {
      console.warn('⚠️ Failed to fetch user profile:', user);
      setError(user.detail || 'Failed to fetch user info');
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    navigate('/dashboard');
  } catch (err) {
    console.error('🔥 Network or server error:', err);
    setError('Something went wrong. Please try again.');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl drop-shadow-lg w-full max-w-md p-8 space-y-6">
        <h2 className="text-3xl font-bold text-blue-900 text-center">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-blue-900">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition"
          >
            Sign In
          </button>
        </form>

        <div className="flex flex-col items-center text-sm text-blue-900 mt-4 space-y-2">
          <Link to="/forgot-password" className="hover:underline">
            Forgot Password?
          </Link>
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
