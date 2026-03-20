import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      const { token, refreshToken, user } = res.data.data;
      setAuth(token, refreshToken, user);
      toast.success(`Welcome to Kesmoving, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        // Show the first specific field validation error
        toast.error(`${data.errors[0].field}: ${data.errors[0].message}`);
      } else {
        toast.error(data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Truck size={32} className="text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Kesmoving</h1>
          <p className="text-primary-200 mt-1">Start your moving journey</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className="input" placeholder="John" value={form.firstName} onChange={update('firstName')} required />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" placeholder="Doe" value={form.lastName} onChange={update('lastName')} required />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
            </div>

            <div>
              <label className="label">Phone Number (Optional)</label>
              <input type="tel" className="input" placeholder="+1 (416) 000-0000" value={form.phone} onChange={update('phone')} />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.password} onChange={update('password')} required minLength={8} />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
