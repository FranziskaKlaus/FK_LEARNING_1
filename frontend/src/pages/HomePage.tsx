import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Shield, TrendingUp, Users, Building2, ArrowRight } from 'lucide-react';
import api from '../services/api';

interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  entity_count: number;
  review_count: number;
}

interface Stats {
  total_entities: number;
  total_reviews: number;
  total_users: number;
  total_sectors: number;
}

const COMPLAINT_TAGS = [
  { label: 'Harassment', icon: '⚠️', color: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Service Quality', icon: '⭐', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'Fraud', icon: '🚨', color: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Pricing', icon: '💰', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'Waiting Times', icon: '⏱️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'Competence', icon: '🎯', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'Reliability', icon: '✅', color: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Communication', icon: '💬', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sectors').then(res => setSectors(res.data)).catch(console.error);
    api.get('/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm">
            <Shield className="w-4 h-4" />
            <span>Verified reviews with evidence uploads</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Real Reviews.<br />
            <span className="text-yellow-300">Verified Evidence.</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Rate and review doctors, hospitals, companies, teachers and more.
            Back your claims with photos, videos, recordings, and documents.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search doctors, hospitals, companies, schools..."
                  className="w-full pl-12 pr-4 py-3 text-gray-900 focus:outline-none rounded-xl text-base"
                />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Search
              </button>
            </div>
          </form>

          {/* Quick search pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Doctor', 'Hospital', 'School', 'Bank', 'Lawyer', 'Restaurant'].map(term => (
              <button
                key={term}
                onClick={() => navigate(`/search?q=${term}`)}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-full transition-colors border border-white/20"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Building2, label: 'Businesses Listed', value: stats.total_entities.toLocaleString() },
                { icon: Star, label: 'Reviews Published', value: stats.total_reviews.toLocaleString() },
                { icon: Users, label: 'Users', value: stats.total_users.toLocaleString() },
                { icon: TrendingUp, label: 'Industries Covered', value: stats.total_sectors.toLocaleString() },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rating categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Rate What Matters</h2>
          <p className="text-gray-500 mt-2">Evaluate services across specific dimensions that matter to you</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COMPLAINT_TAGS.map(tag => (
            <div
              key={tag.label}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border font-medium text-sm ${tag.color}`}
            >
              <span className="text-lg">{tag.icon}</span>
              <span>{tag.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse by Industry</h2>
              <p className="text-gray-500 mt-1">Find reviews for every type of service</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {sectors.map(sector => (
              <Link
                key={sector.id}
                to={`/sector/${sector.slug}`}
                className="card p-5 text-center hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                  style={{ backgroundColor: `${sector.color}15` }}
                >
                  {sector.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                  {sector.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {sector.entity_count} listing{sector.entity_count !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-2">Three simple steps to share your experience</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Find & Review',
              description: 'Search for the doctor, hospital, company or service you want to review',
              icon: '🔍',
            },
            {
              step: '02',
              title: 'Rate Multiple Dimensions',
              description: 'Rate specific areas like service quality, pricing, waiting time, competence and more',
              icon: '⭐',
            },
            {
              step: '03',
              title: 'Upload Evidence',
              description: 'Verify your claims by uploading photos, videos, recordings or documents',
              icon: '📎',
            },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                {item.icon}
              </div>
              <div className="text-xs font-bold text-blue-600 mb-2">STEP {item.step}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Had a bad experience? Share it.</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Help others make informed decisions. Your review with evidence can protect consumers and improve services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              <Star className="w-5 h-5" /> Write a Review
            </Link>
            <Link to="/search" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              Browse Reviews <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
