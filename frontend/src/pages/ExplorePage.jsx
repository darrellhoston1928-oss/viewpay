import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Image as ImageIcon, Sparkles, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = ['All', 'Art & Cosplay', 'Fitness', 'Fashion', 'Photography', 'Gaming', 'Lifestyle', 'Music'];

export function ExplorePage({ onSelectCreator }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sort, setSort] = useState('popular');

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const data = await api.creators.getAll({
        category: selectedCategory,
        search,
        sort
      });
      setCreators(data.creators || []);
    } catch (err) {
      console.error('Failed to load creators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [selectedCategory, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCreators();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Explore Creators</h1>
          <p className="text-sm text-gray-400 mt-1">
            Discover verified artists, fitness coaches, and models publishing exclusive photos & videos.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, @username, or bio..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </form>
      </div>

      {/* Filters & Sorting Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-surface-border">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-black shadow-glow-gold'
                  : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 self-end lg:self-auto">
          <span className="text-xs text-gray-400 font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-surface-card border border-surface-border text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary-500"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Recently Joined</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-72 bg-surface-card rounded-3xl border border-surface-border" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-20 bg-surface-card/40 rounded-3xl border border-surface-border">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No creators found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching to another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map(creator => (
            <div
              key={creator.id}
              onClick={() => onSelectCreator(creator.username)}
              className="group cursor-pointer bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-card-elevated flex flex-col justify-between"
            >
              <div>
                {/* Banner */}
                <div className="relative h-36 bg-surface overflow-hidden">
                  <img
                    src={creator.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                    alt={creator.display_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/30 to-transparent" />
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold text-primary-400 uppercase">
                    {creator.category || 'Creator'}
                  </span>
                </div>

                {/* Avatar and Info */}
                <div className="px-5 pb-4 relative -mt-8">
                  <img
                    src={creator.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={creator.display_name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-surface-border shadow-lg mb-3"
                  />

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors flex items-center">
                        {creator.display_name}
                        <CheckCircle className="w-4 h-4 ml-1.5 text-primary-400 flex-shrink-0" />
                      </h3>
                      <div className="text-xs text-gray-400">@{creator.username}</div>
                    </div>
                    {creator.allow_subscriptions ? (
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400">${creator.subscription_price?.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400 block">/ mo</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">Pay-per-post</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {creator.bio || 'Check out my exclusive photography and video sets.'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-gray-400 bg-surface/50">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-primary-400" />
                    {creator.subscriber_count || 0} subs
                  </span>
                  <span className="flex items-center">
                    <ImageIcon className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {creator.post_count || 0} posts
                  </span>
                </div>
                <span className="text-primary-400 font-semibold group-hover:underline flex items-center">
                  View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
