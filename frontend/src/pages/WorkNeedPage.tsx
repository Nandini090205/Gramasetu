import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, Briefcase, MapPin } from 'lucide-react';
import { WorkNeedView } from '../components/work/WorkNeedView';
import { useAuth } from '../context/AuthContext';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
}

export const WorkNeedPage: React.FC = () => {
  const { onOpenMobileSidebar } = useOutletContext<OutletContextType>();
  const { farmerProfile } = useAuth();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Work Need Platform</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  పని కావాలి
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Farm labor, carpentry (వడ్రంగి), tailoring (కుట్టుపని), and delivery/transportation (రవాణా) opportunities
              </p>
            </div>
          </div>
        </div>

        {farmerProfile?.location && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[150px]">{farmerProfile.location}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
          <WorkNeedView />
        </div>
      </div>
    </div>
  );
};
