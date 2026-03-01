import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Shield, Image, Video, Mic, FileText, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { StarDisplay } from './StarRating';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ReviewRating {
  category: string;
  rating: number;
}

interface ReviewMedia {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
}

interface Review {
  id: string;
  author_name: string;
  author_avatar?: string;
  overall_rating: number;
  title: string;
  content: string;
  visit_date?: string;
  is_verified: number;
  is_anonymous: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  ratings: ReviewRating[];
  media: ReviewMedia[];
  tags: string[];
  entity_response?: string;
  user_vote?: string | null;
}

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

const TAG_COLORS: Record<string, string> = {
  harassment: 'bg-red-100 text-red-700',
  fraud: 'bg-red-100 text-red-700',
  overcharged: 'bg-orange-100 text-orange-700',
  negligence: 'bg-orange-100 text-orange-700',
  excellent_service: 'bg-green-100 text-green-700',
  highly_recommended: 'bg-green-100 text-green-700',
  long_wait: 'bg-yellow-100 text-yellow-700',
  poor_communication: 'bg-yellow-100 text-yellow-700',
};

function MediaIcon({ type }: { type: string }) {
  if (type === 'image') return <Image className="w-4 h-4" />;
  if (type === 'video') return <Video className="w-4 h-4" />;
  if (type === 'audio') return <Mic className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

function MediaPreview({ item }: { item: ReviewMedia }) {
  const src = `/uploads/${item.file_type === 'document' ? '' : ''}`;
  if (item.file_type === 'image') {
    return (
      <a href={`/uploads/${item.file_name}`} target="_blank" rel="noopener noreferrer">
        <img
          src={`/uploads/${item.file_name}`}
          alt={item.file_name}
          className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </a>
    );
  }
  return (
    <a
      href={`/uploads/${item.file_name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors gap-1"
    >
      <MediaIcon type={item.file_type} />
      <span className="text-xs text-gray-500 text-center px-1 truncate w-full text-center">
        {item.file_type}
      </span>
    </a>
  );
}

export default function ReviewCard({ review, onVote }: { review: Review; onVote?: () => void }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [voting, setVoting] = useState(false);
  const [localVote, setLocalVote] = useState(review.user_vote || null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.not_helpful_count);

  const isLong = review.content.length > 300;

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (!user || voting) return;
    setVoting(true);
    try {
      const res = await api.post(`/reviews/${review.id}/vote`, { vote_type: voteType });
      setHelpfulCount(res.data.helpful_count);
      setNotHelpfulCount(res.data.not_helpful_count);
      setLocalVote(localVote === voteType ? null : voteType);
      onVote?.();
    } catch (e) {
      // ignore
    } finally {
      setVoting(false);
    }
  };

  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {review.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{review.author_name}</span>
              {review.is_verified === 1 && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{formattedDate}</span>
            {review.visit_date && (
              <span className="text-xs text-gray-400 ml-2">• Visited: {review.visit_date}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarDisplay rating={review.overall_rating} size="sm" />
          <span className="text-xs font-semibold text-gray-600">{review.overall_rating}/5</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>

      {/* Content */}
      <div className="text-sm text-gray-700 leading-relaxed">
        <p>{expanded || !isLong ? review.content : `${review.content.substring(0, 300)}...`}</p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-blue-600 text-xs flex items-center gap-1 hover:underline"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
          </button>
        )}
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {review.tags.map(tag => (
            <span
              key={tag}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600'}`}
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Category ratings */}
      {review.ratings.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {review.ratings.map(r => (
            <div key={r.category} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-500">{CATEGORY_LABELS[r.category] || r.category}</span>
              <StarDisplay rating={r.rating} size="sm" />
            </div>
          ))}
        </div>
      )}

      {/* Media */}
      {review.media.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Verified Evidence ({review.media.length} file{review.media.length > 1 ? 's' : ''})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {review.media.map(item => (
              <MediaPreview key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Entity response */}
      {review.entity_response && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Response from the business</p>
          <p className="text-sm text-blue-800">{review.entity_response}</p>
        </div>
      )}

      {/* Helpful votes */}
      <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Was this helpful?</span>
        <button
          onClick={() => handleVote('helpful')}
          disabled={!user || voting}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            localVote === 'helpful'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-500 hover:bg-gray-100 disabled:opacity-50'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{helpfulCount}</span>
        </button>
        <button
          onClick={() => handleVote('not_helpful')}
          disabled={!user || voting}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            localVote === 'not_helpful'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-500 hover:bg-gray-100 disabled:opacity-50'
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>{notHelpfulCount}</span>
        </button>
        {!user && <span className="text-xs text-gray-400 italic">Log in to vote</span>}
      </div>
    </div>
  );
}
