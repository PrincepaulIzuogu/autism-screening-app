import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || 'Registration failed');
      } else {
        toast.success('Check your email for the verification code!');
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}&next=signin`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center px-4">
      <div className="w-full max-w-xl p-8 space-y-6 bg-white shadow-xl rounded-xl drop-shadow-lg">
        <h2 className="text-3xl font-bold text-blue-900 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-900">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 w-full"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 w-full"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="md:col-span-2 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 w-full"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 w-full"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 w-full"
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            className="md:col-span-2 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 w-full"
          >
            <option value="">Select Role</option>
            <option>Parent</option>
            <option>Teacher</option>
            <option>Doctor</option>
            <option>Therapist</option>
            <option>Researcher</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full py-2 px-4 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-sm text-blue-900 text-center mt-4">
          Already have an account?{' '}
          <Link to="/signin" className="underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
