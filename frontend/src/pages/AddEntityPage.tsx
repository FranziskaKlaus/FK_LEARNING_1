import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface EntityType {
  id: string;
  name: string;
  sector_id: string;
}

export default function AddEntityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState('');

  const [form, setForm] = useState({
    name: '',
    sector_id: '',
    entity_type_id: '',
    description: '',
    address: '',
    city: '',
    country: '',
    website: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    api.get('/sectors').then(res => setSectors(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.sector_id) {
      const selected = sectors.find(s => s.id === form.sector_id);
      if (selected) {
        api.get(`/sectors/${selected.slug}`)
          .then(res => setEntityTypes(res.data.entity_types || []))
          .catch(console.error);
      }
    } else {
      setEntityTypes([]);
    }
    setForm(prev => ({ ...prev, entity_type_id: '' }));
  }, [form.sector_id]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/entities', form);
      setCreatedSlug(res.data.slug);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Listing Added!</h2>
        <p className="text-gray-500 mb-8">
          The listing has been added to our platform. You can now write a review for it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/entity/${createdSlug}`} className="btn-primary">View Listing & Write Review</Link>
          <Link to="/search" className="btn-secondary">Browse All</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add a New Listing</h1>
      <p className="text-gray-500 mb-6">
        Can't find a doctor, hospital, company or teacher you want to review?
        Add it to our platform.
      </p>

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
          <Link to="/login" className="font-medium hover:underline">Log in</Link> or{' '}
          <Link to="/register" className="font-medium hover:underline">sign up</Link> to add a listing.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g., Dr. John Smith, City Hospital, ABC Bank"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector *</label>
            <select
              value={form.sector_id}
              onChange={e => set('sector_id', e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select a sector...</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          {entityTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.entity_type_id}
                onChange={e => set('entity_type_id', e.target.value)}
                className="input-field"
              >
                <option value="">Select type (optional)...</option>
                {entityTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of this business/service"
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Location */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Location & Contact</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Street address"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="City"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={e => set('country', e.target.value)}
                placeholder="Country"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="https://example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1-555-0100"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="contact@example.com"
              className="input-field"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-xl p-4 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !user}
          className="btn-primary w-full py-3 text-base"
        >
          {submitting ? 'Adding...' : 'Add Listing'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By adding a listing, you confirm this is a legitimate entity.
          False or spam listings will be removed.
        </p>
      </form>
    </div>
  );
}
