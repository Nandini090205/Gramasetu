import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Calculator,
  Award,
  Landmark,
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Coins,
  Users,
  Package,
  ShieldCheck,
  FileText,
  X,
  Loader2,
  HeartHandshake,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import {
  WomenEnterprise,
  CreateWomenEnterprisePayload,
  GovernmentScheme,
  ViabilityCalculatorRequest,
  ViabilityCalculatorResponse,
  SuccessStory,
  CreateWomenEnterpriseInquiryPayload
} from '../../types';
import { womenEnterpriseService } from '../../services/womenEnterpriseService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CATEGORIES = [
  'All',
  'Cold-Pressed Oils & Value Addition',
  'Vermicompost & Bio-Fertilizers',
  'Drone & Agri-Tech Services',
  'Millet & Food Processing',
  'Tailoring & Farm Protection',
  'Dairy & Livestock Collective',
];

export const WomenEnterpriseView: React.FC = () => {
  const { user, farmerProfile } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'schemes' | 'calculator' | 'stories' | 'my-enterprises'>('marketplace');
  const [enterprises, setEnterprises] = useState<WomenEnterprise[]>([]);
  const [myEnterprises, setMyEnterprises] = useState<WomenEnterprise[]>([]);
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Modals
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedEnterpriseForInquiry, setSelectedEnterpriseForInquiry] = useState<WomenEnterprise | null>(null);
  const [inquiryForm, setInquiryForm] = useState<CreateWomenEnterpriseInquiryPayload>({
    buyer_name: farmerProfile?.name || user?.name || '',
    buyer_phone: '',
    inquiry_type: 'Purchase Order',
    message: '',
    quantity_needed: ''
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccessMsg, setInquirySuccessMsg] = useState<string | null>(null);

  // Register Enterprise Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWomenEnterprisePayload>({
    business_name: '',
    title: '',
    category: 'Cold-Pressed Oils & Value Addition',
    description: '',
    shg_group_name: '',
    products_offered: '',
    price_range: '',
    production_capacity: '',
    location: farmerProfile?.location || '',
    district: '',
    contact_name: farmerProfile?.name || user?.name || '',
    contact_phone: '',
    government_scheme_availed: 'Lakhpati Didi / Stree Nidhi',
    certifications: 'FSSAI / Natural Organic'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Calculator State
  const [calcForm, setCalcForm] = useState<ViabilityCalculatorRequest>({
    monthly_units_produced: 300,
    selling_price_per_unit: 320,
    raw_material_cost_per_unit: 190,
    packaging_processing_cost_per_unit: 25,
    fixed_monthly_expenses: 6500,
    enterprise_type: 'Cold-Pressed Groundnut Oil'
  });
  const [calcResult, setCalcResult] = useState<ViabilityCalculatorResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch initial data
  const loadEnterprises = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await womenEnterpriseService.getEnterprises({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchTerm.trim() || undefined,
        district: districtFilter.trim() || undefined
      });
      setEnterprises(data);
    } catch (err: any) {
      console.error('Failed to load enterprises:', err);
      setErrorMsg('Failed to load marketplace listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyEnterprises = async () => {
    try {
      const data = await womenEnterpriseService.getMyEnterprises();
      setMyEnterprises(data);
    } catch (err) {
      console.error('Failed to load user enterprises:', err);
    }
  };

  const loadSchemes = async () => {
    try {
      const data = await womenEnterpriseService.getSchemes();
      setSchemes(data);
    } catch (err) {
      console.error('Failed to load government schemes:', err);
    }
  };

  const loadStories = async () => {
    try {
      const data = await womenEnterpriseService.getSuccessStories();
      setStories(data);
    } catch (err) {
      console.error('Failed to load success stories:', err);
    }
  };

  useEffect(() => {
    loadEnterprises();
    loadSchemes();
    loadStories();
    if (user) {
      loadMyEnterprises();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      const timer = setTimeout(() => {
        loadEnterprises();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCategory, searchTerm, districtFilter]);

  // Handle calculator run
  const runCalculator = async () => {
    setIsCalculating(true);
    try {
      const res = await womenEnterpriseService.calculateViability(calcForm);
      setCalcResult(res);
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'calculator' && !calcResult) {
      runCalculator();
    }
  }, [activeTab]);

  // Handle inquiry submission
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnterpriseForInquiry) return;
    if (!inquiryForm.buyer_name || !inquiryForm.buyer_phone) {
      alert('Please provide your name and phone number.');
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      await womenEnterpriseService.submitInquiry(selectedEnterpriseForInquiry.id, inquiryForm);
      setInquirySuccessMsg(`Order inquiry sent directly to ${selectedEnterpriseForInquiry.contact_name}! They will call you on ${inquiryForm.buyer_phone}.`);
      setTimeout(() => {
        setIsInquiryModalOpen(false);
        setInquirySuccessMsg(null);
        setInquiryForm({
          buyer_name: farmerProfile?.name || user?.name || '',
          buyer_phone: '',
          inquiry_type: 'Purchase Order',
          message: '',
          quantity_needed: ''
        });
      }, 2500);
    } catch (err: any) {
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Handle enterprise registration
  const handleCreateEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.business_name || !createForm.products_offered || !createForm.contact_phone) {
      alert('Please fill out business name, products offered, and contact phone.');
      return;
    }

    setIsCreating(true);
    try {
      await womenEnterpriseService.createEnterprise(createForm);
      setIsCreateModalOpen(false);
      loadEnterprises();
      loadMyEnterprises();
      setActiveTab('marketplace');
      alert('Women Enterprise registered successfully! It is now live in the rural marketplace.');
    } catch (err: any) {
      alert('Failed to register enterprise. Please check all fields.');
    } finally {
      setIsCreating(false);
    }
  };

  // Preset for calculator
  const applyPreset = (presetName: string) => {
    if (presetName === 'oil') {
      setCalcForm({
        enterprise_type: 'Cold-Pressed Groundnut Oil',
        monthly_units_produced: 400,
        selling_price_per_unit: 320,
        raw_material_cost_per_unit: 190,
        packaging_processing_cost_per_unit: 25,
        fixed_monthly_expenses: 7000
      });
    } else if (presetName === 'drone') {
      setCalcForm({
        enterprise_type: 'Drone Spraying Service (Acres)',
        monthly_units_produced: 250,
        selling_price_per_unit: 420,
        raw_material_cost_per_unit: 50,
        packaging_processing_cost_per_unit: 30,
        fixed_monthly_expenses: 12000
      });
    } else if (presetName === 'millet') {
      setCalcForm({
        enterprise_type: 'Sprouted Millet Malt & Flour (Kg)',
        monthly_units_produced: 600,
        selling_price_per_unit: 160,
        raw_material_cost_per_unit: 75,
        packaging_processing_cost_per_unit: 20,
        fixed_monthly_expenses: 5000
      });
    } else if (presetName === 'vermicompost') {
      setCalcForm({
        enterprise_type: 'Enriched Vermicompost (50Kg Bags)',
        monthly_units_produced: 250,
        selling_price_per_unit: 400,
        raw_material_cost_per_unit: 140,
        packaging_processing_cost_per_unit: 30,
        fixed_monthly_expenses: 4500
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Women Entrepreneurship & Lakhpati Didi Mission */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/80 via-purple-950/70 to-slate-900 border border-rose-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>National Lakhpati Didi & Rural SHG Mission</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>Women Entrepreneurship Hub</span>
              <span className="text-rose-400 font-normal">|</span>
              <span className="text-emerald-300 text-xl sm:text-2xl font-bold">మహిళా సాధికారత & వ్యాపార వేదిక</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empowering rural women self-help groups (SHG/DWCRA) through direct marketplace sales, credit-linked government subsidies (PM-FME, Namo Drone Didi, Mudra), and AI profit simulation to achieve sustainable ₹1 Lakh+ annual income.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 flex items-center gap-2 transition duration-200 active:scale-95 border border-rose-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>Register Enterprise / నా వ్యాపారం చేర్చండి</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('calculator');
              }}
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-rose-300 hover:text-white font-semibold text-sm border border-slate-700/80 flex items-center gap-2 transition"
            >
              <Calculator className="w-4 h-4 text-rose-400" />
              <span>Profit Simulator</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{enterprises.length}+</div>
              <div className="text-[11px] text-slate-400 font-medium">SHG Enterprises</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">6 Curated</div>
              <div className="text-[11px] text-slate-400 font-medium">Govt Subsidies</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">₹1,00,000+</div>
              <div className="text-[11px] text-slate-400 font-medium">Lakhpati Target</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">100% Direct</div>
              <div className="text-[11px] text-slate-400 font-medium">Farmer-to-Buyer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'marketplace'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-rose-400" />
          <span>Marketplace & SHGs (మహిళా ఉత్పత్తులు)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200">
            {enterprises.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'schemes'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-400" />
          <span>Govt Schemes & Subsidies (ప్రభుత్వ పథకాలు)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">
            {schemes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-purple-400" />
          <span>Lakhpati Didi Profit Calculator (కాలిక్యులేటర్)</span>
          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200">
            AI P&L
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'stories'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Success Stories (విజయగాథలు)</span>
        </button>

        {user && (
          <button
            onClick={() => setActiveTab('my-enterprises')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'my-enterprises'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>My Ventures & Orders (నా గ్రూప్ ఉత్పత్తులు)</span>
            {myEnterprises.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200">
                {myEnterprises.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: MARKETPLACE & DIRECTORY */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search products, oil, vermicompost, drone, millets, SHG name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div className="sm:w-56 relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Filter district (e.g. Guntur, Chittoor)..."
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <span className="text-sm font-semibold">Loading Women Enterprises...</span>
            </div>
          ) : enterprises.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Women Enterprises Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active listings match your current filters. Try resetting filters or register your own Self Help Group venture!
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchTerm('');
                  setDistrictFilter('');
                }}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enterprises.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition duration-200 hover:shadow-xl hover:shadow-rose-950/20 group relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 truncate max-w-[200px]">
                        {item.category}
                      </span>
                      {item.certifications && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{item.certifications.split(',')[0]}</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Business Name */}
                    <div>
                      <h3 className="font-extrabold text-base text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                        {item.business_name}
                      </h3>
                      <p className="text-xs font-semibold text-rose-400/90 line-clamp-1 mt-0.5">
                        {item.title}
                      </p>
                      {item.shg_group_name && (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-medium mt-1">
                          <Users className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{item.shg_group_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Products & Price Box */}
                    <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Pricing:</span>
                        <span className="text-sm font-black text-emerald-400">{item.price_range}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-slate-400">Capacity:</span>
                        <span className="text-slate-200 font-semibold">{item.production_capacity}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex items-start gap-1">
                        <Package className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 font-medium">{item.products_offered}</span>
                      </div>
                    </div>

                    {/* Government Scheme Tag if availed */}
                    {item.government_scheme_availed && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{item.government_scheme_availed}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Location, Contact & Action */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-[170px]">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        {item.contact_name.split('(')[0]}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${item.contact_phone}`}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700"
                        title={`Call ${item.contact_name}`}
                      >
                        <Phone className="w-4 h-4 text-emerald-400" />
                      </a>
                      <button
                        onClick={() => {
                          setSelectedEnterpriseForInquiry(item);
                          setIsInquiryModalOpen(true);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order / Inquire / ఆర్డర్</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOVERNMENT SCHEMES & SUBSIDIES */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <span>Government Schemes, Grants & Interest Subvention for Rural Women</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Curated financial programs from Central and State Governments (DAY-NRLM, MoFPI, Ministry of Agriculture) tailored for rural women micro-enterprises and DWCRA groups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-5 transition duration-200"
              >
                <div className="space-y-4">
                  {/* Badge & Category */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {scheme.badge || scheme.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {scheme.category}
                    </span>
                  </div>

                  {/* Scheme Name & Tagline */}
                  <div>
                    <h4 className="text-lg font-black text-white flex items-baseline gap-2">
                      <span>{scheme.name}</span>
                      {scheme.name_te && (
                        <span className="text-xs font-normal text-emerald-400">({scheme.name_te})</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                      {scheme.tagline}
                    </p>
                  </div>

                  {/* Highlights Box */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Subsidy / Grant</div>
                      <div className="text-xs font-bold text-emerald-300 mt-0.5">{scheme.subsidy_grant}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Loan Limit</div>
                      <div className="text-xs font-bold text-teal-300 mt-0.5">{scheme.max_loan_limit}</div>
                    </div>
                  </div>

                  {/* Key Benefits */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Key Benefits</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {scheme.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold shrink-0">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Documents Needed */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>Documents Needed</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scheme.documents_needed.map((doc, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800"
                        >
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* How to Apply */}
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-xs text-slate-300">
                    <span className="font-bold text-amber-300">How to Apply: </span>
                    <span>{scheme.how_to_apply}</span>
                  </div>
                </div>

                {/* Portal Link */}
                <div className="pt-4 border-t border-slate-800">
                  <a
                    href={scheme.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700"
                  >
                    <span>Visit Official Scheme Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LAKHPATI DIDI PROFIT CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-400" />
              <span>Lakhpati Didi Viability & P&L Profit Simulator</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Simulate your micro-enterprise production, cost breakdown, and break-even point to ensure your enterprise achieves over ₹1,00,000 net profit per year.
            </p>

            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
              <button
                onClick={() => applyPreset('oil')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-rose-300 border border-slate-800 transition"
              >
                🌾 Cold-Pressed Oil
              </button>
              <button
                onClick={() => applyPreset('drone')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-teal-300 border border-slate-800 transition"
              >
                🛸 Drone Didi Spraying
              </button>
              <button
                onClick={() => applyPreset('millet')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-amber-300 border border-slate-800 transition"
              >
                🥣 Millet Value Add
              </button>
              <button
                onClick={() => applyPreset('vermicompost')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-emerald-300 border border-slate-800 transition"
              >
                🪱 Vermicompost Bio-Inputs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-400" />
                <span>Enterprise Parameters</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Enterprise / Trade Name
                  </label>
                  <input
                    type="text"
                    value={calcForm.enterprise_type}
                    onChange={(e) => setCalcForm({ ...calcForm, enterprise_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Monthly Production / Units Sold</span>
                    <span className="text-purple-400 font-bold">{calcForm.monthly_units_produced} units</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="1500"
                    step="10"
                    value={calcForm.monthly_units_produced}
                    onChange={(e) => setCalcForm({ ...calcForm, monthly_units_produced: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Selling Price Per Unit (₹)</span>
                    <span className="text-emerald-400 font-bold">₹{calcForm.selling_price_per_unit}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={calcForm.selling_price_per_unit}
                    onChange={(e) => setCalcForm({ ...calcForm, selling_price_per_unit: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Raw Material Cost Per Unit (₹)</span>
                    <span className="text-rose-400 font-bold">₹{calcForm.raw_material_cost_per_unit}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="1500"
                    step="5"
                    value={calcForm.raw_material_cost_per_unit}
                    onChange={(e) => setCalcForm({ ...calcForm, raw_material_cost_per_unit: Number(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Packaging & Processing Per Unit (₹)</span>
                    <span className="text-amber-400 font-bold">₹{calcForm.packaging_processing_cost_per_unit}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={calcForm.packaging_processing_cost_per_unit}
                    onChange={(e) => setCalcForm({ ...calcForm, packaging_processing_cost_per_unit: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Fixed Monthly Expenses (Rent, Power, EMIs)</span>
                    <span className="text-slate-300 font-bold">₹{calcForm.fixed_monthly_expenses}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={calcForm.fixed_monthly_expenses}
                    onChange={(e) => setCalcForm({ ...calcForm, fixed_monthly_expenses: Number(e.target.value) })}
                    className="w-full accent-slate-400"
                  />
                </div>
              </div>

              <button
                onClick={runCalculator}
                disabled={isCalculating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition"
              >
                {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                <span>Calculate Viability & Profit</span>
              </button>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-7 space-y-4">
              {calcResult ? (
                <>
                  {/* Lakhpati Status Hero Card */}
                  <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                        Lakhpati Didi Benchmark (₹1,00,000 / Yr)
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {calcResult.lakhpati_didi_target_pct}% of Target
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 via-rose-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(calcResult.lakhpati_didi_target_pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-white">
                          ₹{calcResult.annual_net_profit.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">Estimated Annual Net Profit</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400">
                          ₹{calcResult.monthly_net_profit.toLocaleString('en-IN')} / mo
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          Margin: {calcResult.net_profit_margin_pct}%
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-200">
                        {calcResult.lakhpati_didi_status}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Revenue</div>
                      <div className="text-sm font-black text-white mt-1">₹{calcResult.monthly_revenue.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Variable Costs</div>
                      <div className="text-sm font-black text-rose-400 mt-1">₹{calcResult.monthly_variable_costs.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Fixed Overhead</div>
                      <div className="text-sm font-black text-amber-400 mt-1">₹{calcResult.monthly_fixed_costs.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Break-Even Units</div>
                      <div className="text-sm font-black text-teal-400 mt-1">{calcResult.breakeven_units_per_month} / mo</div>
                    </div>
                  </div>

                  {/* AI Strategic Insights */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Commercial & Profit Insights</span>
                    </h5>
                    <div className="space-y-1.5">
                      {calcResult.insights.map((insight, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matching Schemes Recommendation */}
                  {calcResult.recommended_schemes.length > 0 && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-rose-400" />
                        <span>Recommended Subsidies & Loans for this Venture</span>
                      </h5>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {calcResult.recommended_schemes.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Calculator className="w-8 h-8 text-slate-600" />
                  <span className="text-xs font-medium">Click "Calculate Viability" to view P&L projection</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUCCESS STORIES */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Inspirational Rural Women Champions & Role Models</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Real-world success stories of rural women and DWCRA groups who transformed their families' financial security through agriculture value-addition and high-tech farming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 space-y-4 transition duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      {story.entrepreneur_name}
                    </h4>
                    <p className="text-xs font-semibold text-purple-400 mt-0.5">
                      {story.shg_name}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    {story.business_domain}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Annual Turnover</span>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">{story.annual_turnover}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Women Empowered</span>
                    <div className="text-sm font-black text-teal-300 mt-0.5">{story.members_empowered} Members</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {story.story}
                </p>

                <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 italic text-xs text-amber-200/90">
                  {story.quote}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{story.village}, {story.district}</span>
                  </div>
                  <div className="text-emerald-400 font-semibold text-[11px]">
                    ⭐ {story.key_achievement}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MY ENTERPRISES & ORDERS */}
      {activeTab === 'my-enterprises' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                <span>My Registered Enterprises & Customer Leads</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Manage your group's business listings and view purchase orders sent by interested buyers and farmers.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Listing</span>
            </button>
          </div>

          {myEnterprises.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Registered Ventures Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven't published any women micro-enterprises on this device yet. Click below to register your products in the public rural catalog.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold rounded-xl"
              >
                Register My Enterprise Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myEnterprises.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-extrabold text-white">{item.business_name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.category} • {item.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Inquiries Received</div>
                      <div className="text-xl font-black text-rose-400">{item.inquiries?.length || 0} Orders</div>
                    </div>
                  </div>

                  {/* Inquiries List */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
                      <span>Received Customer Inquiries</span>
                    </h5>

                    {(!item.inquiries || item.inquiries.length === 0) ? (
                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 italic">
                        No purchase orders received yet. Buyers browsing the marketplace can contact you directly.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.inquiries.map((inq) => (
                          <div
                            key={inq.id}
                            className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-white">
                              <span>{inq.buyer_name}</span>
                              <span className="text-emerald-400 font-semibold">{inq.inquiry_type}</span>
                            </div>
                            {inq.quantity_needed && (
                              <div className="text-[11px] text-purple-300">
                                <strong>Quantity: </strong>{inq.quantity_needed}
                              </div>
                            )}
                            {inq.message && (
                              <div className="text-slate-300 text-[11px] italic">
                                "{inq.message}"
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                              <a
                                href={`tel:${inq.buyer_phone}`}
                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{inq.buyer_phone}</span>
                              </a>
                              <span className="text-[10px] text-slate-500">
                                {new Date(inq.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ORDER / INQUIRY MODAL */}
      {isInquiryModalOpen && selectedEnterpriseForInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsInquiryModalOpen(false);
                setInquirySuccessMsg(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-bold uppercase text-rose-400">Direct Purchase Order</div>
              <h3 className="text-lg font-bold text-white mt-1">
                Order from {selectedEnterpriseForInquiry.business_name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Managed by {selectedEnterpriseForInquiry.contact_name} ({selectedEnterpriseForInquiry.location})
              </p>
            </div>

            {inquirySuccessMsg ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">Order Sent Successfully!</div>
                <div className="text-xs text-emerald-300">{inquirySuccessMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.buyer_name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, buyer_name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryForm.buyer_phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, buyer_phone: e.target.value })}
                    placeholder="e.g. 9848012345"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Inquiry Type</label>
                    <select
                      value={inquiryForm.inquiry_type}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, inquiry_type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Purchase Order">Purchase Order / కొనుగోలు</option>
                      <option value="Bulk Supply">Bulk / Mandi Order (హోల్‌సేల్)</option>
                      <option value="Sample Request">Sample Request (శాంపిల్)</option>
                      <option value="Partnership">Partnership / టై-అప్</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Quantity Needed</label>
                    <input
                      type="text"
                      value={inquiryForm.quantity_needed || ''}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, quantity_needed: e.target.value })}
                      placeholder="e.g. 5 Litres / 10 Bags"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Message / Delivery Location</label>
                  <textarea
                    rows={2}
                    value={inquiryForm.message || ''}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    placeholder="Specify delivery village or special requests..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
                  >
                    {isSubmittingInquiry ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>Submit Order Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER ENTERPRISE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full my-8 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-bold uppercase text-rose-400">Rural Self Help Group Hub</div>
              <h3 className="text-lg font-bold text-white mt-1">
                Register Women Enterprise / నా వ్యాపారం చేర్చండి
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                List your products and services to connect directly with farmers, local stores, and consumers.
              </p>
            </div>

            <form onSubmit={handleCreateEnterprise} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Business / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gayatri Gaana Oils"
                    value={createForm.business_name}
                    onChange={(e) => setCreateForm({ ...createForm, business_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SHG / Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Gayatri DWCRA (10 Members)"
                    value={createForm.shg_group_name || ''}
                    onChange={(e) => setCreateForm({ ...createForm, shg_group_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Listing Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Cold-Pressed Groundnut & Sesame Oil / స్వచ్ఛమైన గానుగ నూనెలు"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price Range *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹280 - ₹350 / Litre"
                    value={createForm.price_range}
                    onChange={(e) => setCreateForm({ ...createForm, price_range: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Products Offered *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groundnut Oil, Sesame Oil, Safflower Oil"
                  value={createForm.products_offered}
                  onChange={(e) => setCreateForm({ ...createForm, products_offered: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. 400 Litres / Month"
                    value={createForm.production_capacity}
                    onChange={(e) => setCreateForm({ ...createForm, production_capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Annamayya / Guntur"
                    value={createForm.district || ''}
                    onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Location / Village / Mandal *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madanapalle Rural, Chittoor District"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description & Quality Story</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe your products, traditional preparation method, natural purity, or group history..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smt. Mangamma"
                    value={createForm.contact_name}
                    onChange={(e) => setCreateForm({ ...createForm, contact_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9848123456"
                    value={createForm.contact_phone}
                    onChange={(e) => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Govt Scheme Availed</label>
                  <input
                    type="text"
                    placeholder="e.g. PM FME (35%) / Lakhpati Didi"
                    value={createForm.government_scheme_availed || ''}
                    onChange={(e) => setCreateForm({ ...createForm, government_scheme_availed: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Certifications / Quality</label>
                  <input
                    type="text"
                    placeholder="e.g. FSSAI / Organic Verified"
                    value={createForm.certifications || ''}
                    onChange={(e) => setCreateForm({ ...createForm, certifications: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publish Enterprise</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
