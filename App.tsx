
import React, { useState } from 'react';
import DashboardScreen from './components/DashboardScreen';
import AdminScreen from './components/AdminScreen';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');

  const showAdmin = () => setView('admin');
  const showDashboard = () => setView('dashboard');

  return (
    <ThemeProvider>
      <DataProvider>
        <div className="w-full h-full">
          {view === 'dashboard' ? (
            <DashboardScreen onAdminClick={showAdmin} />
          ) : (
            <AdminScreen onReturnToDashboard={showDashboard} />
          )}
        </div>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
