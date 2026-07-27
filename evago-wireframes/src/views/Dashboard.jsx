import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { EventDiscovery } from './EventDiscovery';
import { TravelOptimization } from './TravelOptimization';
import { TravelPass } from './TravelPass';
import { CharterTransport } from './CharterTransport';

export const Dashboard = () => {
  const [currentView, setCurrentView] = useState('discovery');

  const renderView = () => {
    switch (currentView) {
      case 'discovery':
        return <EventDiscovery onNext={() => setCurrentView('optimization')} />;
      case 'optimization':
        return <TravelOptimization onNext={() => setCurrentView('travelpass')} />;
      case 'travelpass':
        return <TravelPass onNext={() => setCurrentView('charter')} />;
      case 'charter':
        return <CharterTransport />;
      default:
        return <EventDiscovery onNext={() => setCurrentView('optimization')} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      <main className="main-content">
        <div className="container">
          {renderView()}
        </div>
      </main>
    </div>
  );
};
