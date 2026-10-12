import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  IndianRupee, 
  Phone, 
  Clock, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Send, 
  User, 
  MessageSquare, 
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { workService } from '../../services/workService';
import { WorkListing } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const WORK_NEED_CATEGORIES = [
  { value: 'All', label: 'All / అన్నీ', icon: '✨' },
  { value: 'Carpenter', label: 'Carpenter / వడ్రంగి', icon: '🔨' },
  { value: 'Tailoring', label: 'Tailoring / కుట్టుపని', icon: '✂️' },
  { value: 'Delivery (Transportation)', label: 'Delivery / రవాణా', icon: '🚚' },
  { value: 'Harvesting', label: 'Harvesting / కోత పనులు', icon: '🌾' },
  { value: 'Tractor & Machinery', label: 'Machinery / యంత్రాలు', icon: '🚜' },
  { value: 'Spraying', label: 'Spraying / పిచికారీ', icon: '💧' },
  { value: 'Daily Labor', label: 'Daily Labor / కూలీలు', icon: '👥' },
  { value: 'Sowing', label: 'Sowing / నాట్లు', icon: '🌱' },
  { value: 'Irrigation', label: 'Irrigation / నీరు', icon: '🚰' },
  { value: 'General Farm Work', label: 'General / సాధారణ', icon: '🛠️' }
];

export const CATEGORIES = WORK_NEED_CATEGORIES.map(c => c.value);

export const getWorkCategoryMeta = (cat: string) => {
  const normalized = (cat || '').toLowerCase();
  if (normalized.includes('carpenter') || normalized.includes('corpentor')) {
    return { icon: '🔨', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (normalized.includes('tailor')) {
    return { icon: '✂️', badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' };
  }
  if (normalized.includes('delivery') || normalized.includes('transport')) {
    return { icon: '🚚', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
  if (normalized.includes('tractor') || normalized.includes('machinery')) {
    return { icon: '🚜', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }
  if (normalized.includes('spray')) {
    return { icon: '💧', badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
  }
  if (normalized.includes('sow')) {
    return { icon: '🌱', badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-500/30' };
  }
  if (normalized.includes('irrig')) {
    return { icon: '🚰', badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  }
  return { icon: '🌾', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
};

export const WorkNeedView: React.FC = () => {
  const { user, farmerProfile } = useAuth();

  const [listings, setListings] = useState<WorkListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<'all' | 'my-location'>('all');
  
  // Modals & Application state
  const [activeListingForModal, setActiveListingForModal] = useState<WorkListing | null>(null);
  const [requestModalListing, setRequestModalListing] = useState<WorkListing | null>(null);
  const [applicantName, setApplicantName] = useState<string>(farmerProfile?.name || user?.name || '');
  const [applicantPhone, setApplicantPhone] = useState<string>('');
  const [applicantMessage, setApplicantMessage] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const userLocation = farmerProfile?.location || '';

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workService.getPublicListings({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        location: locationFilter === 'my-location' && userLocation ? userLocation : undefined
      });
      setListings(data);
    } catch (err: any) {
      console.error('Failed to load work listings:', err);
      setError(err?.response?.data?.detail || 'Failed to load work opportunities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, locationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleOpenRequestModal = (listing: WorkListing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRequestModalListing(listing);
    setRequestSuccess(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalListing) return;
    if (!applicantName.trim() || !applicantPhone.trim()) {
      alert('Please enter your name and phone number / దయచేసి పేరు మరియు ఫోన్ నంబర్ నమోదు చేయండి');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await workService.requestWork(requestModalListing.id, {
        seeker_name: applicantName.trim(),
        seeker_phone: applicantPhone.trim(),
        message: applicantMessage.trim() || undefined
      });
      setRequestSuccess(`Your work request was submitted successfully to ${requestModalListing.contact_name}! / మీ దరఖాస్తు విజయవంతంగా పంపబడింది.`);
      setApplicantName('');
      setApplicantPhone('');
      setApplicantMessage('');
      setTimeout(() => {
        setRequestModalListing(null);
        setRequestSuccess(null);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit work request:', err);
      alert(err?.response?.data?.detail || 'Failed to submit work request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">
              Work Need / అందుబాటులో ఉన్న పనులు & ఉపాధి
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse agricultural jobs and services posted by verified work providers.
          </p>
        </div>
        <button
          onClick={fetchListings}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-emerald-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh / రీఫ్రెష్</span>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by job title, location, or crop / పని లేదా ప్రాంతం పేరు వెతకండి..."
          className="w-full py-2.5 pl-9 pr-24 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Location Filter Pills */}
      {userLocation && (
        <div className="flex items-center space-x-2 text-xs pt-1">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Location:</span>
          </span>
          <button
            type="button"
            onClick={() => setLocationFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              locationFilter === 'all'
                ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Locations / అన్ని ప్రాంతాలు
          </button>
          <button
            type="button"
            onClick={() => setLocationFilter('my-location')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
              locationFilter === 'my-location'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40'
                : 'bg-slate-800/80 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'
            }`}
          >
            <span>📍 Near Me ({userLocation})</span>
          </button>
        </div>
      )}

      {/* Categories Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {WORK_NEED_CATEGORIES.map((catObj) => (
          <button
            key={catObj.value}
            onClick={() => setSelectedCategory(catObj.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition flex items-center space-x-1.5 ${
              selectedCategory === catObj.value
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/70 text-slate-400 border border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <span>{catObj.icon}</span>
            <span>{catObj.label}</span>
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold">Loading available work opportunities...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && (
        <div className="py-10 px-4 text-center bg-slate-800/40 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-6 h-6 text-emerald-400/80" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">
              No Work Opportunities Available / ప్రస్తుతం ఎలాంటి పనులు లేవు
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no published listings matching your search. Try changing filters or check back later!
            </p>
          </div>
          {(selectedCategory !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium pt-1"
            >
              Clear filters and view all
            </button>
          )}
        </div>
      )}

      {/* Listings List */}
      {!isLoading && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveListingForModal(item)}
              className="group p-4 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-950/20 space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {(() => {
                      const meta = getWorkCategoryMeta(item.category);
                      return (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.badgeBg}`}>
                          <span>{meta.icon}</span>
                          <span>{item.category}</span>
                        </span>
                      );
                    })()}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300">
                      {item.work_type || 'Daily Wage'}
                    </span>
                    {item.urgency === 'Immediate' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        ⚡ Immediate
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-emerald-300 transition">
                    {item.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl whitespace-nowrap">
                    {item.payment}
                  </div>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {item.description}
              </p>

              {/* Location & Provider Info */}
              <div className="pt-2 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.location}</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center space-x-1 text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.contact_name}</span>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 self-end sm:self-auto pt-1 sm:pt-0">
                  <a
                    href={`tel:${item.contact_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/60 transition"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Call</span>
                  </a>

                  <button
                    onClick={(e) => handleOpenRequestModal(item, e)}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Request Work</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Work Detail Modal */}
      {activeListingForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setActiveListingForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {(() => {
                  const meta = getWorkCategoryMeta(activeListingForModal.category);
                  return (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.badgeBg}`}>
                      <span>{meta.icon}</span>
                      <span>{activeListingForModal.category}</span>
                    </span>
                  );
                })()}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300">
                  {activeListingForModal.work_type}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 ml-auto bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {activeListingForModal.payment}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">
                {activeListingForModal.title}
              </h2>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Work Description / పని వివరాలు
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {activeListingForModal.description}
              </p>
            </div>

            {/* Provider Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Location / గ్రామం:</div>
                <div className="font-semibold text-slate-200 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{activeListingForModal.location}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Work Provider:</div>
                <div className="font-semibold text-slate-200 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{activeListingForModal.contact_name}</span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="pt-2 flex items-center space-x-3">
              <a
                href={`tel:${activeListingForModal.contact_phone}`}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center space-x-2 transition"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call {activeListingForModal.contact_phone}</span>
              </a>

              <button
                onClick={() => {
                  const target = activeListingForModal;
                  setActiveListingForModal(null);
                  handleOpenRequestModal(target);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition"
              >
                <Send className="w-4 h-4" />
                <span>Request Work / దరఖాస్తు</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work Request Modal */}
      {requestModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setRequestModalListing(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Work Application / పని దరఖాస్తు
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                {requestModalListing.title}
              </h3>
              <p className="text-xs text-slate-400">
                Send your contact details to {requestModalListing.contact_name}.
              </p>
            </div>

            {requestSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{requestSuccess}</span>
              </div>
            )}

            {!requestSuccess && (
              <form onSubmit={handleSubmitRequest} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name / మీ పేరు <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Subba Rao"
                    className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number / ఫోన్ నంబర్ <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="e.g. 9848012345"
                    className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message / సందేశం (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={applicantMessage}
                    onChange={(e) => setApplicantMessage(e.target.value)}
                    placeholder="e.g. Available immediately with 4 experienced workers..."
                    className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setRequestModalListing(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {isSubmittingRequest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
