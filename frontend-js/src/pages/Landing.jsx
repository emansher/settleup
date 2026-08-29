import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <nav className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-brand-700 text-xl">
          <span className="text-3xl">💰</span> SettleUp
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-brand-700 font-medium hover:underline">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition">
            Sign up free
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-16 pb-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Split expenses.<br />
          <span className="text-brand-600">Settle up fairly.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Create groups with friends, roommates, or travel buddies. Log shared costs, see who owes what, and settle balances without awkward conversations.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold text-lg hover:bg-brand-700 shadow-lg shadow-brand-200 transition">
            Get started — it's free
          </Link>
          <Link to="/login" className="px-8 py-3 bg-white text-brand-700 border border-brand-200 rounded-xl font-semibold text-lg hover:bg-brand-50 transition">
            I already have an account
          </Link>
        </div>

        <div className="mt-20 grid sm:grid-cols-3 gap-8 text-left">
          {[
            { title: 'Create groups', desc: 'Invite friends by email. You become the owner and control membership.' },
            { title: 'Log expenses', desc: 'Record who paid and how the cost should be split — equally or custom.' },
            { title: 'See balances', desc: 'Instantly know who owes whom. Settle up when you\'re ready.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">{f.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
