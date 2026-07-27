import React, { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { EventDiscovery } from './EventDiscovery';
import { TravelOptimization } from './TravelOptimization';
import { TravelPass } from './TravelPass';
import { CharterTransport } from './CharterTransport';
import { evagoApi } from '../services/api';

export const Dashboard = () => {
  const [currentView, setCurrentView] = useState('discovery');
  const [itinerary, setItinerary] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load latest travel pass on mount to restore session state
  useEffect(() => {
    const fetchLatestPass = async () => {
      try {
        const res = await evagoApi.getLatestPass();
        if (res?.pass) {
          setItinerary(res.pass.itinerary || []);
          setSelectedBooking(res.pass.booking || null);
          // If a booking exists, jump directly to the TravelPass view!
          setCurrentView('travelpass');
        }
      } catch (err) {
        console.error('Failed to load latest travel pass:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestPass();
  }, []);

  const handleProceedFromDiscovery = (selectedEvents) => {
    setItinerary(selectedEvents || []);
    setCurrentView('optimization');
  };

  const handleProceedFromOptimization = async (bookingDetails) => {
    setSelectedBooking(bookingDetails);
    try {
      await evagoApi.saveTravelPass(itinerary, bookingDetails);
    } catch (err) {
      console.error('Failed to save travel pass to server:', err);
    }
    setCurrentView('travelpass');
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-24 text-center">
          <p className="text-body">Loading your EVAGO session...</p>
        </div>
      );
    }

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
