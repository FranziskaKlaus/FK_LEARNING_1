import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { StarInput } from '../components/StarRating';
import MediaUploader from '../components/MediaUploader';
import { useAuth } from '../context/AuthContext';

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

const RATING_CATEGORIES = [
  { key: 'service_quality', label: 'Service Quality', icon: '⭐', description: 'Overall quality of service received' },
  { key: 'harassment', label: 'Harassment', icon: '⚠️', description: 'Respect, dignity and proper treatment' },
  { key: 'fraud', label: 'Fraud / Honesty', icon: '🚨', description: 'Transparency and honest dealing' },
  { key: 'pricing', label: 'Pricing / Value', icon: '💰', description: 'Fairness of pricing and value for money' },
  { key: 'waiting_time', label: 'Waiting Time', icon: '⏱️', description: 'Speed and punctuality' },
  { key: 'competence', label: 'Competence', icon: '🎯', description: 'Professional expertise and skill' },
  { key: 'reliability', label: 'Reliability', icon: '✅', description: 'Consistency and dependability' },
  { key: 'communication', label: 'Communication', icon: '💬', description: 'Clarity and responsiveness' },
  { key: 'cleanliness', label: 'Cleanliness', icon: '🧹', description: 'Hygiene and environment quality' },
];

const COMMON_TAGS = [
  { value: 'harassment', label: 'Harassment', type: 'negative' },
  { value: 'fraud', label: 'Fraud', type: 'negative' },
  { value: 'overcharged', label: 'Overcharged', type: 'negative' },
  { value: 'negligence', label: 'Negligence', type: 'negative' },
  { value: 'long_wait', label: 'Long Wait', type: 'negative' },
  { value: 'poor_communication', label: 'Poor Communication', type: 'negative' },
  { value: 'rude_staff', label: 'Rude Staff', type: 'negative' },
  { value: 'excellent_service', label: 'Excellent Service', type: 'positive' },
  { value: 'highly_recommended', label: 'Highly Recommended', type: 'positive' },
  { value: 'professional', label: 'Professional', type: 'positive' },
  { value: 'fast_service', label: 'Fast Service', type: 'positive' },
  { value: 'good_value', label: 'Good Value', type: 'positive' },
];

export default function WriteReviewPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [overallRating, setOverallRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!entityId) return;

    // Find entity by ID
    api.get('/entities/search', { params: { limit: 100 } })
      .then(res => {
        const found = res.data.entities.find((e: any) => e.id === entityId);
        if (found) {
          setEntity(found);
        } else {
          navigate('/search');
        }
      })
      .catch(() => navigate('/search'))
      .finally(() => setLoading(false));
  }, [entityId, user]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (overallRating === 0) {
      setError('Please select an overall rating');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title for your review');
      return;
    }
    if (content.trim().length < 20) {
      setError('Review content must be at least 20 characters');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('entity_id', entityId!);
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('overall_rating', String(overallRating));
      if (visitDate) formData.append('visit_date', visitDate);
      formData.append('is_anonymous', String(isAnonymous));
      formData.append('ratings', JSON.stringify(categoryRatings));
      formData.append('tags', JSON.stringify(selectedTags));

      for (const f of mediaFiles) {
        formData.append('media', f.file);
      }

      await api.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="card p-6">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Review Submitted!</h2>
        <p className="text-gray-500 mb-8">
          Thank you for sharing your experience. Your review helps others make informed decisions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/entity/${entity?.slug}`} className="btn-primary">
            View Reviews for {entity?.name}
          </Link>
          <Link to="/search" className="btn-secondary">Browse More</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/entity/${entity?.slug}`} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to {entity?.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
        {entity && (
          <p className="text-gray-500 mt-1">
            Reviewing: <strong className="text-gray-800">{entity.name}</strong>
            {entity.city && <span className="text-gray-400"> • {entity.city}</span>}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall rating */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Overall Rating *</h2>
          <div className="flex items-center gap-4">
            <StarInput rating={overallRating} onChange={setOverallRating} size="lg" />
            {overallRating > 0 && (
              <span className="text-2xl font-bold text-gray-800">{overallRating}/5</span>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {['Terrible', 'Poor', 'Average', 'Good', 'Excellent'].map((label, i) => (
              <span
                key={label}
                className={`text-xs flex-1 text-center py-1 rounded transition-colors ${
                  overallRating === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Title & Content */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Your Review *</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Summarize your experience in one line"
              maxLength={100}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Review <span className="text-gray-400 font-normal">(min. 20 characters)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your experience in detail. What happened? What was good or bad? Would you recommend this service?"
              rows={6}
              className="input-field resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Visit / Experience</label>
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Post anonymously (your username will be hidden)</span>
          </label>
        </div>

        {/* Category ratings */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Rate Specific Areas</h2>
          <p className="text-sm text-gray-500 mb-4">Optional: Rate individual dimensions of your experience</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RATING_CATEGORIES.map(cat => (
              <div key={cat.key} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                </div>
                <p className="text-xs text-gray-400">{cat.description}</p>
                <StarInput
                  rating={categoryRatings[cat.key] || 0}
                  onChange={r => setCategoryRatings(prev => ({ ...prev, [cat.key]: r }))}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Tags</h2>
          <p className="text-sm text-gray-500 mb-4">Select all that apply to your experience</p>
          <div>
            <p className="text-xs font-medium text-red-600 mb-2">Complaints</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_TAGS.filter(t => t.type === 'negative').map(tag => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTags.includes(tag.value)
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-green-600 mb-2">Praise</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.filter(t => t.type === 'positive').map(tag => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTags.includes(tag.value)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Media upload */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Upload Evidence</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Strengthen your review with photos, videos, audio recordings or documents.
                Evidence makes your review more credible and trustworthy.
              </p>
            </div>
          </div>
          <MediaUploader files={mediaFiles} onChange={setMediaFiles} maxFiles={10} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-xl p-4 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 py-3 text-base"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <Link to={`/entity/${entity?.slug}`} className="btn-secondary flex-1 py-3 text-base text-center">
            Cancel
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center">
          By submitting, you agree that your review is truthful and based on genuine experience.
          False reviews may be removed and may result in legal consequences.
        </p>
      </form>
    </div>
  );
}
