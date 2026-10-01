import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileSidebar } from './MobileSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { AddCarModal } from '../../../features/cars/AddCarModal';

import { useData } from '../../context/DataContext';

export const DashboardLayout: React.FC = () => {
  const { addCar } = useData();
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EBF3EE] p-0 sm:p-5 lg:p-7 flex items-center justify-center font-sans antialiased text-slate-800 dir-rtl">
      {/* Master Framed Dashboard Card */}
      <div className="w-full max-w-[1500px] bg-white rounded-none sm:rounded-[32px] shadow-sm border-0 sm:border border-slate-200/50 flex flex-col md:flex-row min-h-screen sm:min-h-[90vh] overflow-hidden">
        {/* Integrated Dark Green Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Inner Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <Topbar
            onOpenNewCarModal={() => setIsAddCarOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-24 md:pb-6 space-y-5 sm:space-y-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Quick-Access Touch Navigation Bar */}
      <MobileBottomNav
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        onOpenNewCarModal={() => setIsAddCarOpen(true)}
      />

      {/* Mobile Slide-Out Full Drawer Navigation */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenNewCarModal={() => {
          setIsMobileMenuOpen(false);
          setIsAddCarOpen(true);
        }}
      />

      {/* Add Car Modal */}
      <AddCarModal
        isOpen={isAddCarOpen}
        onClose={() => setIsAddCarOpen(false)}
        onAddCar={(car, newCust) => addCar(car, newCust)}
      />
    </div>
  );
};
