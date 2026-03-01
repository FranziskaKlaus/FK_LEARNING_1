import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';
import EntityCard from '../components/EntityCard';

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

interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const sector = searchParams.get('sector') || '';
  const city = searchParams.get('city') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    api.get('/sectors').then(res => setSectors(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLocalQ(q);
    fetchEntities();
  }, [searchParams]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (sector) params.sector = sector;
      if (city) params.city = city;
      params.page = String(page);
      params.limit = '12';

      const res = await api.get('/entities/search', { params });
      setEntities(res.data.entities);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localQ) newParams.set('q', localQ);
    else newParams.delete('q');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams();
    if (q) newParams.set('q', q);
    setSearchParams(newParams);
  };

  const hasFilters = sector || city;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localQ}
              onChange={e => setLocalQ(e.target.value)}
              placeholder="Search doctors, hospitals, companies, schools..."
              className="input-field pl-10 py-3 text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-3">Search</button>
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`btn-secondary px-4 flex items-center gap-2 ${hasFilters ? 'border-blue-400 text-blue-600' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          </button>
        </div>
      </form>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="card p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector</label>
              <select
                value={sector}
                onChange={e => setFilter('sector', e.target.value)}
                className="input-field"
              >
                <option value="">All Sectors</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.slug}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setFilter('city', e.target.value)}
                placeholder="Filter by city..."
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sector quick filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('sector', '')}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            !sector ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          All
        </button>
        {sectors.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter('sector', s.slug === sector ? '' : s.slug)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
              sector === s.slug
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600 text-sm">
          {loading ? 'Searching...' : (
            <>{pagination.total} result{pagination.total !== 1 ? 's' : ''}
              {q && <span> for "<strong>{q}</strong>"</span>}
            </>
          )}
        </p>
        <Link to="/add-entity" className="text-sm text-blue-600 hover:underline">
          Can't find it? Add it →
        </Link>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : entities.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map(entity => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setFilter('page', String(p))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === pagination.page
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
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500 mb-6">
            We couldn't find any listings matching your search.
          </p>
          <Link to="/add-entity" className="btn-primary">
            Add a New Listing
          </Link>
        </div>
      )}
    </div>
  );
}
