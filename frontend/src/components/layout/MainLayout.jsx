import { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Outlet es donde se renderizan las páginas hijas
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-bg overflow-hidden">
      
      {/* Sidebar (Navegación) */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Área scrolleable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;