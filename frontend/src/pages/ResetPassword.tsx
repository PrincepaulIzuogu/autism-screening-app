import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const email = localStorage.getItem('resetEmail');
    if (!email) {
      setError('Email not found. Please restart the reset process.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', code);
      formData.append('new_password', newPassword);

      const res = await fetch('http://localhost:8000/reset-password', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail[0]?.msg || 'Something went wrong'
          : typeof data.detail === 'string'
            ? data.detail
            : data.detail?.msg || 'Something went wrong';

        setError(message);
        return;
      }

      navigate('/signin');
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl drop-shadow-lg w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-blue-900 text-center">Reset Password</h2>
        <p className="text-sm text-blue-800 text-center">
          Enter your new password and the verification code sent to your email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-blue-900">
          <div>
            <label htmlFor="code" className="block text-sm font-medium">
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
