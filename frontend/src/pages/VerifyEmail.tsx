import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const next = searchParams.get('next') || 'signin';
  const email = searchParams.get('email') || localStorage.getItem('resetEmail');

  useEffect(() => {
    if (email) {
      localStorage.setItem('resetEmail', email);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email is missing. Please go back and try again.');
      return;
    }

    if (code.trim().length < 4) {
      setError('Please enter a valid verification code.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', code);

      const res = await fetch('http://localhost:8000/verify-email', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Verification failed');
        return;
      }

      navigate(`/${next}`);
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl drop-shadow-lg w-full max-w-md p-8 space-y-6 text-blue-900">
        <h2 className="text-2xl font-bold text-center">Verify Your Email</h2>
        <p className="text-sm text-center">
          Enter the code sent to your email to complete verification.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter verification code"
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
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
