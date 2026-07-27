import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Plane, Bus, Clock, ShieldCheck, Ticket, MapPin } from 'lucide-react';

export const TravelOptimization = ({ onNext }) => {
  const [activeTab, setActiveTab] = useState('time');
  const [departure, setDeparture] = useState('London (LHR)');
  const [returnPlace, setReturnPlace] = useState('London (LHR)');

  // State for selected segments
  const [selectedFlight, setSelectedFlight] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(0);

  const flightOptions = [
    { id: 0, provider: 'British Airways', time: '14h 30m', price: 850, type: 'Direct', timeMatch: true },
    { id: 1, provider: 'Emirates', time: '16h 15m', price: 620, type: '1 Stop', timeMatch: false },
  ];

  const transferOptions = [
    { id: 0, provider: 'Premium Private Car', time: '25m', price: 80, comfortMatch: true },
    { id: 1, provider: 'Shared Shuttle', time: '45m', price: 15, comfortMatch: false },
    { id: 2, provider: 'Airport Express Train', time: '30m', price: 25, priceMatch: true },
  ];

  return (
    <div className="flex-col gap-6">
      <div className="mb-4">
        <h2>Travel Optimisation</h2>
        <p className="text-body mt-2">Customise your travel segments and set your departure locations.</p>
      </div>

      <Card status="standard" className="mb-6">
        <h3 className="mb-4">Trip Details</h3>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="flex-col gap-2">
            <label className="text-caption">Departure Location</label>
            <div className="flex items-center gap-2 p-3 border border-[var(--color-card-border)] rounded-md">
              <MapPin size={16} className="text-tertiary" />
              <input 
                type="text" 
                value={departure} 
                onChange={(e) => setDeparture(e.target.value)} 
                className="w-full border-none outline-none text-primary bg-transparent font-medium"
              />
            </div>
          </div>
          <div className="flex-col gap-2">
            <label className="text-caption">Return Location</label>
            <div className="flex items-center gap-2 p-3 border border-[var(--color-card-border)] rounded-md">
              <MapPin size={16} className="text-tertiary" />
              <input 
                type="text" 
                value={returnPlace} 
                onChange={(e) => setReturnPlace(e.target.value)} 
                className="w-full border-none outline-none text-primary bg-transparent font-medium"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 mb-6">
        <Button 
          variant={activeTab === 'time' ? 'primary' : 'secondary'} 
          onClick={() => setActiveTab('time')}
        >
          <Clock size={16}/> Optimise for Time
        </Button>
        <Button 
          variant={activeTab === 'comfort' ? 'primary' : 'secondary'} 
          onClick={() => setActiveTab('comfort')}
        >
          <ShieldCheck size={16}/> Optimise for Comfort
        </Button>
        <Button 
          variant={activeTab === 'price' ? 'primary' : 'secondary'} 
          onClick={() => setActiveTab('price')}
        >
          <Ticket size={16}/> Optimise for Price
        </Button>
      </div>

      <h3 className="mb-4">Journey Segments</h3>
      
      <div className="flex-col gap-6">
        {/* Segment 1: Flight */}
        <div className="flex-col gap-2">
          <h4 className="text-secondary mb-2">Segment 1: Inbound Flight to Singapore</h4>
          {flightOptions.map(option => (
            <Card 
              key={option.id} 
              status={selectedFlight === option.id ? 'success' : 'standard'}
              className="cursor-pointer transition-all hover-border-primary"
              onClick={() => setSelectedFlight(option.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Plane size={24} className="text-primary" />
                  <div>
                    <div className="font-semibold text-primary">{option.provider}</div>
                    <div className="text-caption mt-1">{option.type} &bull; {option.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {option.timeMatch && activeTab === 'time' && <Badge status="live">Fastest</Badge>}
                  <div className="text-price">${option.price}</div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedFlight === option.id ? 'border-[var(--color-success)] bg-[var(--color-success)]' : 'border-[var(--color-card-border)]'}`}>
                    {selectedFlight === option.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Segment 2: Transfer */}
        <div className="flex-col gap-2 mt-4">
          <h4 className="text-secondary mb-2">Segment 2: Airport to Hotel Transfer</h4>
          {transferOptions.map(option => (
            <Card 
              key={option.id} 
              status={selectedTransfer === option.id ? 'success' : 'standard'}
              className="cursor-pointer transition-all hover-border-primary"
              onClick={() => setSelectedTransfer(option.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Bus size={24} className="text-primary" />
                  <div>
                    <div className="font-semibold text-primary">{option.provider}</div>
                    <div className="text-caption mt-1">{option.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {option.comfortMatch && activeTab === 'comfort' && <Badge status="live">Most Comfortable</Badge>}
                  {option.priceMatch && activeTab === 'price' && <Badge status="success">Cheapest</Badge>}
                  <div className="text-price">${option.price}</div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedTransfer === option.id ? 'border-[var(--color-success)] bg-[var(--color-success)]' : 'border-[var(--color-card-border)]'}`}>
                    {selectedTransfer === option.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-card-border)]">
          <div>
            <div className="text-caption">Total Trip Cost</div>
            <div className="text-price mt-1">
              ${flightOptions[selectedFlight].price + transferOptions[selectedTransfer].price}
            </div>
          </div>
          <Button variant="primary" onClick={onNext}>Confirm & Book Journey</Button>
        </div>
      </div>
    </div>
  );
};
