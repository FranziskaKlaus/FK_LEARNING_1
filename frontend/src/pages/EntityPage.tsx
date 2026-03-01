import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Globe, Phone, Mail, Star, Shield, ArrowLeft, CheckCircle, ChevronDown } from 'lucide-react';
import api from '../services/api';
import ReviewCard from '../components/ReviewCard';
import { StarDisplay, getRatingColor, getRatingLabel } from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

const CATEGORY_LABELS: Record<string, string> = {
  harassment: 'Harassment',
  service_quality: 'Service Quality',
  fraud: 'Fraud',
  pricing: 'Pricing',
  waiting_time: 'Waiting Time',
  competence: 'Competence',
  reliability: 'Reliability',
  communication: 'Communication',
  cleanliness: 'Cleanliness',
};

type SortType = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

export default function EntityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entity, setEntity] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [sort, setSort] = useState<SortType>('newest');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!slug) return;
    api.get(`/entities/${slug}`)
      .then(res => setEntity(res.data))
      .catch(() => navigate('/search'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!entity) return;
    fetchReviews();
  }, [entity, sort, ratingFilter, page]);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const params: Record<string, string> = { sort, page: String(page), limit: '10' };
      if (ratingFilter) params.rating = ratingFilter;
      const res = await api.get(`/reviews/entity/${entity.id}`, { params });
      setReviews(res.data.reviews);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="card p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!entity) return null;

  const ratingColor = getRatingColor(entity.avg_overall_rating);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={-1 as any} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Entity header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Icon / Logo */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${entity.sector_color || '#3B82F6'}15` }}
          >
            {entity.logo_url ? (
              <img src={entity.logo_url} alt={entity.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              entity.sector_icon || '🏢'
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {entity.name}
                  {entity.is_verified === 1 && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Link to={`/sector/${entity.sector_slug}`} className="text-sm text-blue-600 hover:underline">
                    {entity.sector_icon} {entity.sector_name}
                  </Link>
                  {entity.entity_type_name && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{entity.entity_type_name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Overall rating */}
              {entity.total_reviews > 0 && (
                <div className={`px-4 py-3 rounded-xl text-center ${ratingColor}`}>
                  <p className="text-3xl font-bold leading-none">{entity.avg_overall_rating.toFixed(1)}</p>
                  <p className="text-sm font-semibold mt-1">{getRatingLabel(entity.avg_overall_rating)}</p>
                  <StarDisplay rating={entity.avg_overall_rating} size="sm" />
                  <p className="text-xs mt-1 opacity-75">{entity.total_reviews} review{entity.total_reviews !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            {entity.description && (
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">{entity.description}</p>
            )}

            {/* Contact info */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {entity.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {[entity.address, entity.city, entity.country].filter(Boolean).join(', ')}
                </span>
              )}
              {entity.website && (
                <a href={entity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
              {entity.phone && (
                <a href={`tel:${entity.phone}`} className="flex items-center gap-1.5 hover:text-blue-600">
                  <Phone className="w-4 h-4" /> {entity.phone}
                </a>
              )}
              {entity.email && (
                <a href={`mailto:${entity.email}`} className="flex items-center gap-1.5 hover:text-blue-600">
                  <Mail className="w-4 h-4" /> {entity.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Rating breakdown by category */}
        {entity.category_ratings?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Rating Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {entity.category_ratings.map((cr: any) => (
                <div key={cr.category} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{CATEGORY_LABELS[cr.category] || cr.category}</span>
                    <span className="text-xs font-bold text-gray-700">{Number(cr.avg_rating).toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-yellow-400 h-1.5 rounded-full"
                      style={{ width: `${(cr.avg_rating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Star distribution */}
        {entity.star_distribution?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Star Distribution</h3>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const dist = entity.star_distribution.find((d: any) => d.overall_rating === star);
                const count = dist?.count || 0;
                const pct = entity.total_reviews > 0 ? (count / entity.total_reviews) * 100 : 0;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(ratingFilter === String(star) ? '' : String(star))}
                    className={`flex items-center gap-2 w-full group rounded-lg px-2 py-1 transition-colors ${
                      ratingFilter === String(star) ? 'bg-yellow-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs text-gray-500 w-8 text-right">{star} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Write review button */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          {user ? (
            <Link
              to={`/write-review/${entity.id}`}
              className="btn-primary flex items-center gap-2 justify-center"
            >
              <Star className="w-4 h-4" /> Write a Review
            </Link>
          ) : (
            <Link to="/login" className="btn-primary flex items-center gap-2 justify-center">
              <Star className="w-4 h-4" /> Log in to Write a Review
            </Link>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Verify your review with photos, videos or documents</span>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {pagination.total || 0} Review{(pagination.total || 0) !== 1 ? 's' : ''}
            {ratingFilter && <span className="text-base font-normal text-gray-500"> for {ratingFilter} star{Number(ratingFilter) !== 1 ? 's' : ''}</span>}
          </h2>
          <div className="flex items-center gap-3">
            {ratingFilter && (
              <button
                onClick={() => setRatingFilter('')}
                className="text-sm text-red-500 hover:underline"
              >
                Clear filter
              </button>
            )}
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as SortType); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
              <option value="helpful">Most helpful</option>
            </select>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} onVote={fetchReviews} />
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {Array.from({ length: pagination.pages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500 text-sm mb-4">Be the first to review {entity.name}</p>
            {user ? (
              <Link to={`/write-review/${entity.id}`} className="btn-primary">
                Write First Review
              </Link>
            ) : (
              <Link to="/login" className="btn-primary">Log in to Review</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
