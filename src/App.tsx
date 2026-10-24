/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';

// Views
import { Dashboard } from './components/Dashboard.tsx';
import { LessonLibrary } from './components/LessonLibrary.tsx';
import { ScriptStudio } from './components/ScriptStudio.tsx';
import { VideoProductionStudio } from './components/VideoProductionStudio.tsx';
import { VideoLibrary } from './components/VideoLibrary.tsx';
import { PublishingHub } from './components/PublishingHub.tsx';
import { AIProvidersView } from './components/AIProvidersView.tsx';
import { UsageAndCostsView } from './components/UsageAndCostsView.tsx';
import { SchedulerView } from './components/SchedulerView.tsx';
import { ActivityLogsView } from './components/ActivityLogsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';

const AppContent: React.FC = () => {
  const { tab, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold animate-pulse">
          🇹🇭🇲🇲
        </div>
        <div className="text-sm font-semibold tracking-wide">
          Thai2Myanmar AI Studio စတင်နေပါသည်...
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Loading persistent database and AI engine
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (tab) {
      case 'dashboard':
        return <Dashboard />;
      case 'lessons':
        return <LessonLibrary />;
      case 'studio':
        return <ScriptStudio />;
      case 'production':
        return <VideoProductionStudio />;
      case 'videos':
        return <VideoLibrary />;
      case 'publish':
        return <PublishingHub />;
      case 'providers':
        return <AIProvidersView />;
      case 'usage':
        return <UsageAndCostsView />;
      case 'scheduler':
        return <SchedulerView />;
      case 'logs':
        return <ActivityLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
