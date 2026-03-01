import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export function StarDisplay({ rating, maxStars = 5, size = 'md', showValue = false }: Omit<StarRatingProps, 'interactive' | 'onChange'>) {
  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span key={i} className="relative inline-block">
            <Star className={`${starSize} text-gray-200 fill-gray-200`} />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${(rating % 1) * 100}%` }}
              >
                <Star className={`${starSize} text-yellow-400 fill-yellow-400`} />
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export function StarInput({ rating, onChange, size = 'md' }: { rating: number; onChange: (r: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="star-btn focus:outline-none"
          title={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${starSize} transition-colors ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 fill-gray-300 hover:text-yellow-300 hover:fill-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Color coding for ratings
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600 bg-green-50';
  if (rating >= 3.5) return 'text-lime-600 bg-lime-50';
  if (rating >= 2.5) return 'text-yellow-600 bg-yellow-50';
  if (rating >= 1.5) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Great';
  if (rating >= 2.5) return 'Average';
  if (rating >= 1.5) return 'Poor';
  return 'Bad';
}
