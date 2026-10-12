import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  List, 
  MapPin, 
  IndianRupee, 
  Phone, 
  Calendar, 
  Wheat, 
  User, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Eye, 
  Clock, 
  X, 
  Check, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Hammer,
  Scissors,
  Truck,
  Sparkles,
  Package
} from 'lucide-react';
import { workService } from '../../services/workService';
import { WorkListing, CreateWorkListingPayload } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface CategoryOption {
  value: string;
  label: string;
  telugu: string;
  icon: string;
  badgeBg: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  suggestedWorkType: string;
  suggestedPayment: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 'Carpenter',
    label: 'Carpenter (Woodwork)',
    telugu: 'వడ్రంగి పని & మరమ్మత్తులు',
    icon: '🔨',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    titlePlaceholder: 'e.g. Farm Carpenter Needed for Cart, Plow & Shed Repairs / వడ్రంగి పని కావాలి',
    descriptionPlaceholder: 'Need skilled carpenter for repairing wooden bullock carts, wooden plows, fencing stakes, cattle shed wooden rafters, and agricultural tool handles.',
    suggestedWorkType: 'Daily Wage',
    suggestedPayment: '₹900 / Day'
  },
  {
    value: 'Tailoring',
    label: 'Tailoring & Stitching',
    telugu: 'కుట్టుపని (టార్పాలిన్, బ్యాగులు)',
    icon: '✂️',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    titlePlaceholder: 'e.g. Tailoring for Crop Tarpaulin & Gunny Bags Stitching / టార్పాలిన్ & సంచుల కుట్టుపని',
    descriptionPlaceholder: 'Experienced tailor needed for heavy cloth stitching, crop drying tarpaulins repair, shade net stitching, and packaging grain bags.',
    suggestedWorkType: 'Per Piece',
    suggestedPayment: '₹650 / Day'
  },
  {
    value: 'Delivery (Transportation)',
    label: 'Delivery & Transportation',
    telugu: 'రవాణా & డెలివరీ (ఆటో/ట్రాక్టర్)',
    icon: '🚚',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    titlePlaceholder: 'e.g. Goods Auto / Tractor Delivery for Paddy to Mandi / వ్యవసాయ సరుకు రవాణా',
    descriptionPlaceholder: 'Require pickup truck, auto trolley, or tractor trolley with driver to transport 45-50 bags of harvested grain from farm gate to market yard / cold storage.',
    suggestedWorkType: 'Per Trip',
    suggestedPayment: '₹1,800 / Trip'
  },
  {
    value: 'Harvesting',
    label: 'Harvesting',
    telugu: 'కోత పనులు',
    icon: '🌾',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    titlePlaceholder: 'e.g. 8 Laborers Needed for Paddy Harvesting / వరి కోత కూలీలు కావాలి',
    descriptionPlaceholder: 'Require 6 to 8 experienced farm laborers for crop harvesting and manual bundling across 4 acres. Lunch and tea provided.',
    suggestedWorkType: 'Daily Wage',
    suggestedPayment: '₹750 / Day'
  },
  {
    value: 'Tractor & Machinery',
    label: 'Tractor & Machinery',
    telugu: 'ట్రాక్టర్ & యంత్రాలు',
    icon: '🚜',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    titlePlaceholder: 'e.g. Tractor with Rotavator for Field Preparation / రోటవేటర్ పని',
    descriptionPlaceholder: 'Need 45HP+ tractor with rotavator for dry land ploughing and seed bed preparation across 3 acres.',
    suggestedWorkType: 'Per Acre',
    suggestedPayment: '₹1,200 / Hour'
  },
  {
    value: 'Spraying',
    label: 'Spraying',
    telugu: 'మందు పిచికారీ',
    icon: '💧',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    titlePlaceholder: 'e.g. Spraying Workers for Chilli/Cotton Crop / మందు పిచికారీ',
    descriptionPlaceholder: 'Looking for 2 skilled workers with battery sprayers for bio-pesticide and micronutrient spray in crop field.',
    suggestedWorkType: 'Daily Wage',
    suggestedPayment: '₹800 / Day'
  },
  {
    value: 'Daily Labor',
    label: 'Daily Farm Labor',
    telugu: 'రోజువారీ కూలీలు',
    icon: '👥',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    titlePlaceholder: 'e.g. 5 Laborers for Weeding & Bund Work / పొలం కూలీలు',
    descriptionPlaceholder: 'Daily farm labor needed for morning shift weeding, cleaning irrigation channels, and general farm work.',
    suggestedWorkType: 'Daily Wage',
    suggestedPayment: '₹700 / Day'
  },
  {
    value: 'Sowing',
    label: 'Sowing & Transplantation',
    telugu: 'విత్తనాలు & నాట్లు',
    icon: '🌱',
    badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    titlePlaceholder: 'e.g. Workers for Paddy Transplantation / వరి నాట్లు',
    descriptionPlaceholder: 'Need experienced group of workers for manual seedling transplantation in 3 acres.',
    suggestedWorkType: 'Per Acre',
    suggestedPayment: '₹3,500 / Acre'
  },
  {
    value: 'Irrigation',
    label: 'Irrigation',
    telugu: 'నీటి పారుదల',
    icon: '🚰',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    titlePlaceholder: 'e.g. Drip Pipeline Maintenance & Layout / డ్రిప్ పని',
    descriptionPlaceholder: 'Laying drip lateral pipes, flushing filters, and clearing sub-main water delivery channels.',
    suggestedWorkType: 'Contract',
    suggestedPayment: '₹1,500 / Day'
  },
  {
    value: 'General Farm Work',
    label: 'General Farm Work',
    telugu: 'సాధారణ వ్యవసాయ పనులు',
    icon: '🛠️',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    titlePlaceholder: 'e.g. Farm Yard Maintenance & Fencing / సాధారణ పనులు',
    descriptionPlaceholder: 'Assisting in cattle feeding, fence repairs, cleaning storage sheds, and general farmyard upkeep.',
    suggestedWorkType: 'Daily Wage',
    suggestedPayment: '₹650 / Day'
  }
];

export const CATEGORIES = CATEGORY_OPTIONS.map(c => c.value);

export const getCategoryMeta = (cat: string) => {
  const normalized = (cat || '').toLowerCase();
  if (normalized.includes('carpenter') || normalized.includes('corpentor')) {
    return CATEGORY_OPTIONS.find(c => c.value === 'Carpenter')!;
  }
  if (normalized.includes('tailor')) {
    return CATEGORY_OPTIONS.find(c => c.value === 'Tailoring')!;
  }
  if (normalized.includes('delivery') || normalized.includes('transport')) {
    return CATEGORY_OPTIONS.find(c => c.value === 'Delivery (Transportation)')!;
  }
  const match = CATEGORY_OPTIONS.find(c => c.value.toLowerCase() === normalized);
  return match || {
    value: cat,
    label: cat,
    telugu: 'వ్యవసాయ పని',
    icon: '💼',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    titlePlaceholder: 'e.g. Farm Work Opportunity',
    descriptionPlaceholder: 'Work details and requirements...',
    suggestedWorkType: 'Daily Wage',
    suggestedPayment: '₹750 / Day'
  };
};

export const WorkProviderView: React.FC = () => {
  const { user, farmerProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'my-listings'>('create');
  const [myListings, setMyListings] = useState<WorkListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Carpenter');
  const [payment, setPayment] = useState('');
  const [workType, setWorkType] = useState('Daily Wage');
  const [urgency, setUrgency] = useState('Immediate');
  const [location, setLocation] = useState(farmerProfile?.location || '');
  const [contactName, setContactName] = useState(farmerProfile?.name || user?.name || '');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Listing State
  const [editingListing, setEditingListing] = useState<WorkListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Carpenter');
  const [editWorkType, setEditWorkType] = useState('Daily Wage');
  const [editUrgency, setEditUrgency] = useState('Immediate');
  const [editPayment, setEditPayment] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Expanded applicants listing ID
  const [expandedApplicantsId, setExpandedApplicantsId] = useState<number | null>(null);

  const fetchMyListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workService.getMyListings();
      setMyListings(data);
    } catch (err: any) {
      console.error('Failed to load my listings:', err);
      setError(err?.response?.data?.detail || 'Failed to fetch your listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-listings') {
      fetchMyListings();
    }
  }, [activeTab]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !payment.trim() || !location.trim() || !contactName.trim() || !contactPhone.trim() || !description.trim()) {
      setError('Please fill in all required fields / దయచేసి అన్ని తప్పనిసరి వివరాలను నమోదు చేయండి.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload: CreateWorkListingPayload = {
      title: title.trim(),
      category,
      payment: payment.trim(),
      work_type: workType,
      urgency,
      location: location.trim(),
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      description: description.trim(),
      status: 'published'
    };

    try {
      await workService.createListing(payload);
      setSuccessMsg('Work listing published successfully! It is now live in the Work Need interface. / మీ పని ప్రకటన విజయవంతంగా ప్రచురించబడింది.');
      // Reset form
      setTitle('');
      setPayment('');
      setDescription('');
      // Switch to my listings
      setTimeout(() => {
        setActiveTab('my-listings');
        setSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      console.error('Failed to publish listing:', err);
      setError(err?.response?.data?.detail || 'Failed to publish work listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (listing: WorkListing) => {
    const newStatus = listing.status === 'published' ? 'completed' : 'published';
    try {
      await workService.updateListing(listing.id, { status: newStatus });
      setMyListings(prev =>
        prev.map(item => item.id === listing.id ? { ...item, status: newStatus } : item)
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('Failed to update listing status.');
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing? / మీరు ఖచ్చితంగా ఈ ప్రకటనను తొలగించాలనుకుంటున్నారా?')) {
      return;
    }

    try {
      await workService.deleteListing(id);
      setMyListings(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Failed to delete listing:', err);
      alert(err?.response?.data?.detail || 'Failed to delete listing.');
    }
  };

  const handleApplyTemplate = (catValue: string) => {
    const meta = getCategoryMeta(catValue);
    setTitle(meta.titlePlaceholder.replace(/^e\.g\.\s*/, ''));
    setDescription(meta.descriptionPlaceholder);
    setWorkType(meta.suggestedWorkType);
    setPayment(meta.suggestedPayment);
  };

  const handleStartEdit = (listing: WorkListing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditCategory(listing.category || 'Carpenter');
    setEditWorkType(listing.work_type || 'Daily Wage');
    setEditUrgency(listing.urgency || 'Immediate');
    setEditPayment(listing.payment);
    setEditLocation(listing.location);
    setEditPhone(listing.contact_phone);
    setEditDescription(listing.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setIsSavingEdit(true);
    try {
      const updated = await workService.updateListing(editingListing.id, {
        title: editTitle.trim(),
        category: editCategory,
        work_type: editWorkType,
        urgency: editUrgency,
        payment: editPayment.trim(),
        location: editLocation.trim(),
        contact_phone: editPhone.trim(),
        description: editDescription.trim()
      });
      setMyListings(prev => prev.map(item => item.id === updated.id ? updated : item));
      setEditingListing(null);
    } catch (err: any) {
      console.error('Failed to update listing:', err);
      alert(err?.response?.data?.detail || 'Failed to update listing.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">
              Work Provider / పని కల్పన & సేవల ప్రచురణ
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Post agricultural jobs, hire farm workers, or offer machinery services.
          </p>
        </div>

        {/* Sub-tabs: Post New Work vs My Listings */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Work / కొత్త పని</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-listings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'my-listings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>My Listings / నా జాబితాలు</span>
            {myListings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-emerald-300 font-bold">
                {myListings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 shadow-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. CREATE WORK LISTING FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          {/* Quick Service Selection Chips */}
          <div className="space-y-2 p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Select Service / పని విభాగం ఎంచుకోండి</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">10 Categories</span>
              </span>
              <button
                type="button"
                onClick={() => handleApplyTemplate(category)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center space-x-1 transition"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Auto-fill Template / ఉదాహరణ టెంప్లేట్</span>
              </button>
            </div>

            {/* Service Category Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCategory(opt.value);
                  }}
                  className={`p-2 rounded-xl text-left border transition text-xs flex flex-col gap-0.5 ${
                    category === opt.value
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 truncate">
                    <span>{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{opt.telugu}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Work Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Work Title / పని శీర్షిక <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getCategoryMeta(category).titlePlaceholder}
              className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Selected Category / ఎంచుకున్న విభాగం
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label} — {opt.telugu}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment or Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Payment / Budget / వేతనం <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder={getCategoryMeta(category).suggestedPayment || 'e.g. ₹800 / Day or ₹1,800 / Trip'}
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Work Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Type / రకం
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Daily Wage">Daily Wage / రోజువారీ వేతనం</option>
                <option value="Contract">Contract / కాంట్రాక్ట్</option>
                <option value="Per Trip">Per Trip / రవాణా ఛార్జీ (ట్రిప్పుకు - Delivery)</option>
                <option value="Per Piece">Per Piece / పని చొప్పున (పీసుకు - Tailoring/Carpentry)</option>
                <option value="Per Acre">Per Acre / ఎకరానికి</option>
                <option value="Full Time">Full Time / పూర్తి సమయం</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Urgency / ప్రాధాన్యత
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Immediate">Immediate / అత్యవసరం</option>
                <option value="Within 2-3 Days">Within 2-3 Days / 2-3 రోజుల్లో</option>
                <option value="Flexible">Flexible / సమయం ఉంది</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Location / గ్రామం & జిల్లా <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tenali, Guntur District"
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Provider Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Provider Name / మీ పేరు <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Ramesh Naidu"
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Contact Phone / ఫోన్ నంబర్ <span className="text-emerald-400">*</span>
            </label>
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. 9848012345"
              className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Work Description & Requirements / పని పూర్తి వివరాలు <span className="text-emerald-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={getCategoryMeta(category).descriptionPlaceholder || "Describe the work, number of people required, working hours, tools, or transport facilities..."}
              className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm
                shadow-xl shadow-emerald-950 flex items-center justify-center space-x-2 transition
                disabled:opacity-50 active:scale-[0.98]
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Work Listing / పనిని ప్రకటించండి</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 2. MY LISTINGS MANAGEMENT */}
      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Listings created from your device ({myListings.length})
            </span>
            <button
              onClick={fetchMyListings}
              disabled={isLoading}
              className="inline-flex items-center space-x-1 text-xs text-slate-300 hover:text-emerald-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoading && (
            <div className="py-10 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs">Loading your listings...</span>
            </div>
          )}

          {!isLoading && myListings.length === 0 && (
            <div className="py-10 px-4 text-center bg-slate-800/40 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                <List className="w-6 h-6 text-emerald-400/80" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">
                  You Haven't Posted Any Work Listings Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click below to post your first work listing and reach workers in your area.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Your First Work</span>
              </button>
            </div>
          )}

          {!isLoading && myListings.length > 0 && (
            <div className="space-y-3">
              {myListings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const meta = getCategoryMeta(item.category);
                          return (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.badgeBg}`}>
                              <span>{meta.icon}</span>
                              <span>{item.category}</span>
                            </span>
                          );
                        })()}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}>
                          {item.status === 'published' ? 'Active / Live in Work Need' : 'Completed / Closed'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {item.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-400">
                        {item.payment}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{item.location}</span>
                      </span>
                      <span>•</span>
                      <span>{item.contact_phone}</span>
                    </div>

                    {/* Management Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title={item.status === 'published' ? 'Mark as Completed' : 'Reactivate Listing'}
                        className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        {item.status === 'published' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEdit(item)}
                        title="Edit Listing"
                        className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        title="Delete Listing"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Applicants / Requests Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedApplicantsId(expandedApplicantsId === item.id ? null : item.id)}
                      className="text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1 font-medium transition"
                    >
                      <span>Applicants & Inquiries ({item.request_count || (item.requests ? item.requests.length : 0)})</span>
                      {expandedApplicantsId === item.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {expandedApplicantsId === item.id && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 animate-in fade-in">
                        {(!item.requests || item.requests.length === 0) ? (
                          <div className="text-xs text-slate-500 py-1">
                            No inquiries received yet for this listing.
                          </div>
                        ) : (
                          item.requests.map((req) => (
                            <div key={req.id} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200">{req.seeker_name}</span>
                                <a href={`tel:${req.seeker_phone}`} className="text-emerald-400 font-semibold flex items-center space-x-1 hover:underline">
                                  <Phone className="w-3 h-3" />
                                  <span>{req.seeker_phone}</span>
                                </a>
                              </div>
                              {req.message && (
                                <p className="text-slate-300 text-[11px] italic">"{req.message}"</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingListing(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Edit Work Listing / పని వివరాలు సవరించండి
              </h3>
              <p className="text-xs text-slate-400">
                Update the title, payment, location, or description.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title / శీర్షిక
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category / విభాగం
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full py-2.5 px-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Type / రకం
                  </label>
                  <select
                    value={editWorkType}
                    onChange={(e) => setEditWorkType(e.target.value)}
                    className="w-full py-2.5 px-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Daily Wage">Daily Wage</option>
                    <option value="Contract">Contract</option>
                    <option value="Per Trip">Per Trip (Delivery)</option>
                    <option value="Per Piece">Per Piece (Tailoring/Carpentry)</option>
                    <option value="Per Acre">Per Acre</option>
                    <option value="Full Time">Full Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment / వేతనం
                  </label>
                  <input
                    type="text"
                    required
                    value={editPayment}
                    onChange={(e) => setEditPayment(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / ఫోన్
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location / ప్రాంతం
                </label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / వివరాలు
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
