import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { EventDiscovery } from './EventDiscovery';
import { TravelOptimization } from './TravelOptimization';
import { TravelPass } from './TravelPass';
import { CharterTransport } from './CharterTransport';

export const Dashboard = () => {
  const [currentView, setCurrentView] = useState('discovery');
  const [itinerary, setItinerary] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleProceedFromDiscovery = (selectedEvents) => {
    setItinerary(selectedEvents || []);
    setCurrentView('optimization');
  };

  const handleProceedFromOptimization = (bookingDetails) => {
    setSelectedBooking(bookingDetails);
    setCurrentView('travelpass');
  };

  const renderView = () => {
    switch (currentView) {
      case 'discovery':
        return (
          <EventDiscovery 
            onNext={handleProceedFromDiscovery} 
            initialItinerary={itinerary}
          />
        );
      case 'optimization':
        return (
          <TravelOptimization 
            onNext={handleProceedFromOptimization} 
            itinerary={itinerary}
          />
        );
      case 'travelpass':
        return (
          <TravelPass 
            onNext={() => setCurrentView('charter')} 
            itinerary={itinerary}
            booking={selectedBooking}
          />
        );
      case 'charter':
        return <CharterTransport itinerary={itinerary} />;
      default:
        return (
          <EventDiscovery 
            onNext={handleProceedFromDiscovery} 
            initialItinerary={itinerary}
          />
        );
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
