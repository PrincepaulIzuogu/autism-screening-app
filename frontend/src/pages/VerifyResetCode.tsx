import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyResetCode = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('resetEmail');
    if (!savedEmail) {
      navigate('/forgot-password');
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', code);

      const res = await fetch('http://localhost:8000/verify-reset-code', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail[0]?.msg || 'Verification failed'
          : data.detail?.msg || data.detail || 'Verification failed';
        setError(message);
        return;
      }

      navigate('/reset-password');
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl drop-shadow-lg w-full max-w-md p-8 space-y-6 text-blue-900">
        <h2 className="text-2xl font-bold text-center">Verify Reset Code</h2>
        <p className="text-sm text-center">
          Enter the code sent to your email to continue resetting your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition"
          >
            Verify Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyResetCode;
