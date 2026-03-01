import { Link } from 'react-router-dom';
import { MapPin, Star, MessageSquare, CheckCircle } from 'lucide-react';
import { StarDisplay, getRatingColor, getRatingLabel } from './StarRating';

interface Entity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  country?: string;
  sector_name: string;
  sector_slug: string;
  sector_icon: string;
  sector_color: string;
  entity_type_name?: string;
  avg_overall_rating: number;
  total_reviews: number;
  is_verified: number;
}

export default function EntityCard({ entity }: { entity: Entity }) {
  const ratingColor = getRatingColor(entity.avg_overall_rating);

  return (
    <Link to={`/entity/${entity.slug}`} className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 block group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: `${entity.sector_color}15` }}
          >
            {entity.sector_icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {entity.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-gray-500">{entity.sector_name}</span>
              {entity.entity_type_name && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{entity.entity_type_name}</span>
                </>
              )}
              {entity.is_verified === 1 && (
                <span className="flex items-center gap-0.5 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating badge */}
        {entity.total_reviews > 0 && (
          <div className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-center ${ratingColor}`}>
            <p className="text-lg font-bold leading-none">{entity.avg_overall_rating.toFixed(1)}</p>
            <p className="text-xs font-medium">{getRatingLabel(entity.avg_overall_rating)}</p>
          </div>
        )}
      </div>

      {/* Description */}
      {entity.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{entity.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {entity.total_reviews > 0 ? (
            <div className="flex items-center gap-1.5">
              <StarDisplay rating={entity.avg_overall_rating} size="sm" />
              <span className="text-gray-500 font-medium">
                {entity.total_reviews} review{entity.total_reviews !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>No reviews yet</span>
            </div>
          )}
        </div>
        {(entity.city || entity.country) && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{[entity.city, entity.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
