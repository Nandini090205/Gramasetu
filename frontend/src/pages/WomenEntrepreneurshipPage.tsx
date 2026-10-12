import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, HeartHandshake, MapPin, Sparkles } from 'lucide-react';
import { WomenEnterpriseView } from '../components/women/WomenEnterpriseView';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
}

export const WomenEntrepreneurshipPage: React.FC = () => {
  const { onOpenMobileSidebar } = useOutletContext<OutletContextType>();
  const { farmerProfile } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-md shadow-rose-950/40">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>Women Entrepreneurship Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  మహిళా సాధికారత
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Lakhpati Didi • SHG Marketplace • PM-FME & Namo Drone Didi Subsidies • Profit Simulator
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {farmerProfile?.location && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="truncate max-w-[140px] font-medium">{farmerProfile.location}</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>DAY-NRLM / DWCRA</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <WomenEnterpriseView />
      </div>
    </div>
  );
};

export default WomenEntrepreneurshipPage;
