import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Wheat, 
  Layers, 
  Calendar, 
  Globe, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Menu,
  Maximize2,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, normalizeLanguageCode, SupportedLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { farmerService } from '../services/farmerService';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
}

export const ProfilePage: React.FC = () => {
  const { onOpenMobileSidebar } = useOutletContext<OutletContextType>();
  const { user, farmerProfile, farmerUuid, updateFarmerProfile, resetDeviceProfile } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [preferredLanguage, setPreferredLanguage] = useState('Telugu');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [soilType, setSoilType] = useState('');
  const [currentCropStage, setCurrentCropStage] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogout = () => {
    resetDeviceProfile();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (farmerProfile) {
      setName(farmerProfile.name || user?.name || '');
      setAge(farmerProfile.age !== undefined && farmerProfile.age !== null ? String(farmerProfile.age) : '');
      setPreferredLanguage(farmerProfile.preferred_language || 'Telugu');
      setLocation(farmerProfile.location || '');
      setFarmSize(farmerProfile.farm_size || '');
      setPrimaryCrop(farmerProfile.primary_crop || '');
      setSoilType(farmerProfile.soil_type || '');
      setCurrentCropStage(farmerProfile.current_crop_stage || '');
    } else if (user) {
      setName(user.name || '');
    }
  }, [farmerProfile, user]);

  // Keep dropdown synced if language is changed from top-right switcher
  useEffect(() => {
    const matchingOption = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
    if (matchingOption) {
      setPreferredLanguage(matchingOption.name);
    }
  }, [currentLanguage]);

  const handleLanguageChange = (langName: string) => {
    setPreferredLanguage(langName);
    const code = normalizeLanguageCode(langName);
    setLanguage(code, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateFarmerProfile({
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        preferred_language: preferredLanguage,
        location: location.trim(),
        farm_size: farmSize.trim(),
        primary_crop: primaryCrop.trim(),
        soil_type: soilType.trim(),
        current_crop_stage: currentCropStage,
      });

      const code = normalizeLanguageCode(preferredLanguage);
      setLanguage(code, true);

      setSuccessMessage(t('profile.success', 'Farmer profile updated successfully! KRISHI AI will now tailor recommendations using your updated farm context.'));
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || t('common.error', 'Failed to update farmer profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 min-w-0 overflow-y-auto">
      {/* Header */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold text-slate-200">{t('profile.title', 'Farmer Agricultural Profile')}</h2>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main Profile Form */}
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Banner Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{name || user?.name || 'Farmer'}</h1>
              <p className="text-xs text-slate-400">
                {farmerUuid ? `Device ID: ${farmerUuid.slice(0, 13)}...` : (user?.email || 'Saved on Device')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              🌱 Farm Context Active
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
              title="Logout & Start Fresh as New User"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('auth.logout', 'Logout / లాగౌట్')}</span>
            </button>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3 shadow-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wheat className="w-5 h-5 text-emerald-500" />
              Farmer & Agricultural Details
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Providing accurate details enables KRISHI AI to generate personalized agricultural advice tailored to your crop, land, and region.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Farmer Name / రైతు పేరు
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar / రమేష్ కుమార్"
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Age / వయస్సు
              </label>
              <input
                type="number"
                min={15}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 42"
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Location / District / State
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Guntur, Andhra Pradesh"
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Number of Acres of Land */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                Acres of Land / భూమి విస్తీర్ణం
              </label>
              <input
                type="text"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                placeholder="e.g. 4 Acres / 4 ఎకరాలు"
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Primary Crop */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5 text-emerald-400" />
                Main Crop / Crop Type / ప్రధాన పంట
              </label>
              <input
                type="text"
                value={primaryCrop}
                onChange={(e) => setPrimaryCrop(e.target.value)}
                placeholder="e.g. Tomato, Rice, Cotton, Chilli"
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Preferred Language / మాట్లాడే భాష
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="Marathi">मరాఠీ (Marathi)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
              </select>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Soil Type
              </label>
              <input
                type="text"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                placeholder="e.g. Red Soil, Black Soil, Loam, Sandy"
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Current Crop Stage */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Current Crop Stage
              </label>
              <select
                value={currentCropStage}
                onChange={(e) => setCurrentCropStage(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">-- Select Stage --</option>
                <option value="Sowing / Nursery">Sowing / Nursery</option>
                <option value="Vegetative Growth">Vegetative Growth</option>
                <option value="Flowering Stage">Flowering Stage</option>
                <option value="Fruiting / Grain Formation">Fruiting / Grain Formation</option>
                <option value="Pre-Harvesting">Pre-Harvesting</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-950 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Farm Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Account & Device Session Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-400" />
              Device Session & Switch Farmer / ఖాతా మార్పిడి & లాగౌట్
            </h4>
            <p className="text-xs text-slate-400">
              Logging out will clear this device session and return to the new farmer onboarding registration form.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout & Register as New Farmer</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {t('auth.logout_confirm_title', 'Logout & Switch Farmer?')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('auth.logout_confirm_sub', 'లాగౌట్ చేసి కొత్త రైతుగా నమోదు కావాలా?')}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50 leading-relaxed">
              {t('auth.logout_warning', 'Logging out will clear your local session on this device. You will be directed to the Farmer Onboarding Form to register fresh details.')}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                {t('common.cancel', 'Cancel / రద్దు')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-2 shadow-lg shadow-rose-900/40"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('auth.confirm_logout', 'Confirm Logout / లాగౌట్ చేయండి')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
