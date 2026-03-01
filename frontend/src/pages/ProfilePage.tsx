import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, LogOut, User, Shield, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StarDisplay } from '../components/StarRating';

interface MyReview {
  id: string;
  title: string;
  content: string;
  overall_rating: number;
  entity_name: string;
  entity_slug: string;
  sector_name: string;
  sector_icon: string;
  created_at: string;
  helpful_count: number;
  is_verified: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.get('/reviews/user/me')
      .then(res => setReviews(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{user.full_name || user.username}</h2>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-1">{user.email}</p>

            {user.is_admin === 1 && (
              <span className="mt-3 flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Administrator
              </span>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> Reviews
              </span>
              <span className="font-semibold text-gray-900">{reviews.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Star className="w-4 h-4" /> Avg. Rating Given
              </span>
              <span className="font-semibold text-gray-900">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length).toFixed(1)
                  : '-'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>

        {/* Reviews */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Reviews</h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{review.sector_icon}</span>
                        <Link
                          to={`/entity/${review.entity_slug}`}
                          className="text-sm font-medium text-blue-600 hover:underline truncate"
                        >
                          {review.entity_name}
                        </Link>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-xs text-gray-500">{review.sector_name}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{review.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{review.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StarDisplay rating={review.overall_rating} size="sm" />
                      {review.is_verified === 1 && (
                        <span className="text-xs text-green-600 flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                      {review.helpful_count > 0 && (
                        <span className="ml-2 text-green-600">• {review.helpful_count} found helpful</span>
                      )}
                    </span>
                    <Link
                      to={`/entity/${review.entity_slug}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-500 text-sm mb-4">Share your experience with the community</p>
              <Link to="/search" className="btn-primary text-sm">
                Find Something to Review
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
