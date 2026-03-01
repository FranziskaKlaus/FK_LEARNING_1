import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import EntityCard from '../components/EntityCard';

export default function SectorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sector, setSector] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.get(`/sectors/${slug}`),
      api.get('/entities/search', { params: { sector: slug, limit: 20 } }),
    ]).then(([sectorRes, entitiesRes]) => {
      setSector(sectorRes.data);
      setEntities(entitiesRes.data.entities);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Sector not found</h2>
        <Link to="/" className="mt-4 inline-block text-blue-600">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Sector header */}
      <div className="card p-6 mb-8" style={{ borderLeft: `4px solid ${sector.color}` }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${sector.color}15` }}
          >
            {sector.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sector.name}</h1>
            <p className="text-gray-500 mt-1">{sector.description}</p>
          </div>
        </div>

        {/* Entity type filters */}
        {sector.entity_types?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {sector.entity_types.map((type: any) => (
              <Link
                key={type.id}
                to={`/search?sector=${slug}&type=${type.slug}`}
                className="text-sm px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-full text-gray-700 hover:text-blue-600 transition-colors"
              >
                {type.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Entities */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {entities.length} listing{entities.length !== 1 ? 's' : ''} in {sector.name}
        </h2>
        <Link to="/add-entity" className="text-sm text-blue-600 hover:underline">
          + Add listing
        </Link>
      </div>

      {entities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map(entity => (
            <EntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">{sector.icon}</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-500 mb-6">Be the first to add a listing in {sector.name}.</p>
          <Link to="/add-entity" className="btn-primary">Add Listing</Link>
        </div>
      )}
    </div>
  );
}
