import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/send-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail[0]?.msg || 'Something went wrong'
          : data.detail?.msg || data.detail || 'Something went wrong';
        setError(message);
        return;
      }

      localStorage.setItem('resetEmail', email);
      navigate('/reset-password');
    } catch (err) {
      console.error(err);
      setError('Failed to send reset code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl drop-shadow-lg w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-blue-900 text-center">Forgot Password</h2>
        <p className="text-sm text-blue-800 text-center">
          Enter your email address and we’ll send you a code to reset your password.
        </p>

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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition"
          >
            Send Code
          </button>
        </form>

        <div className="text-sm text-blue-900 text-center mt-4">
          <Link to="/signin" className="underline font-medium">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
