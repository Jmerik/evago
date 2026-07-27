import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Plane, Bus, Clock, ShieldCheck, Ticket, MapPin, Calendar, ArrowRight, Train, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { evagoApi } from '../services/api';

export const TravelOptimization = ({ onNext, itinerary = [] }) => {
  const [activePreset, setActivePreset] = useState('time'); // 'time', 'comfort', 'price'
  const [departure, setDeparture] = useState('London Heathrow (LHR)');
  const [returnPlace, setReturnPlace] = useState('London Heathrow (LHR)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extract destination stops from itinerary
  const rawStops = itinerary.map(i => i.venue?.city || i.name.replace(/^Trip to /, '')).filter(Boolean);
  const stops = Array.from(new Set(rawStops.length > 0 ? rawStops : ['Singapore']));
  const destinationsList = stops.join(' ➔ ');

  // Autocomplete state for departure
  const [depSuggestions, setDepSuggestions] = useState([]);
  const [depLoading, setDepLoading] = useState(false);
  const [depDropdownOpen, setDepDropdownOpen] = useState(false);
  const depDebounceRef = useRef(null);

  // Autocomplete state for return
  const [retSuggestions, setRetSuggestions] = useState([]);
  const [retLoading, setRetLoading] = useState(false);
  const [retDropdownOpen, setRetDropdownOpen] = useState(false);
  const retDebounceRef = useRef(null);

  const fetchDepSuggestions = (query) => {
    if (depDebounceRef.current) clearTimeout(depDebounceRef.current);
    if (!query || query.length < 2) {
      setDepSuggestions([]);
      setDepDropdownOpen(false);
      return;
    }
    depDebounceRef.current = setTimeout(async () => {
      setDepLoading(true);
      try {
        const data = await evagoApi.autocompleteDestinations(query);
        const suggestions = (data.suggestions || []).slice(0, 5);
        setDepSuggestions(suggestions);
        setDepDropdownOpen(suggestions.length > 0);
      } catch (err) {
        console.error('Departure autocomplete error:', err);
      } finally {
        setDepLoading(false);
      }
    }, 300);
  };

  const fetchRetSuggestions = (query) => {
    if (retDebounceRef.current) clearTimeout(retDebounceRef.current);
    if (!query || query.length < 2) {
      setRetSuggestions([]);
      setRetDropdownOpen(false);
      return;
    }
    retDebounceRef.current = setTimeout(async () => {
      setRetLoading(true);
      try {
        const data = await evagoApi.autocompleteDestinations(query);
        const suggestions = (data.suggestions || []).slice(0, 5);
        setRetSuggestions(suggestions);
        setRetDropdownOpen(suggestions.length > 0);
      } catch (err) {
        console.error('Return autocomplete error:', err);
      } finally {
        setRetLoading(false);
      }
    }, 300);
  };

  // Generate dynamic travel legs based on stops
  const firstStop = stops[0] || 'Singapore';
  const lastStop = stops[stops.length - 1] || firstStop;

  // Leg 1: Inbound Flight
  const inboundOptions = [
    { id: 0, provider: 'Singapore Airlines', time: '13h 10m', price: 980, type: 'Direct (Non-stop)', tag: 'time' },
    { id: 1, provider: 'British Airways', time: '14h 30m', price: 850, type: 'Direct', tag: 'comfort' },
    { id: 2, provider: 'Emirates', time: '16h 15m', price: 620, type: '1 Stop via Dubai', tag: 'price' },
  ];

  // Inter-city leg (if multi-stop)
  const interCityOptions = stops.length > 1 ? [
    { id: 0, provider: 'Shinkansen / High-Speed Rail Express', time: '2h 15m', price: 140, type: 'Direct Train', tag: 'time' },
    { id: 1, provider: 'ANA Domestic Flight', time: '1h 10m', price: 190, type: 'Direct Flight', tag: 'comfort' },
    { id: 2, provider: 'Highway Express Bus', time: '5h 30m', price: 45, type: 'Coach Bus', tag: 'price' },
  ] : [];

  // Leg 2 / Outbound Return Flight
  const outboundOptions = [
    { id: 0, provider: 'Lufthansa / Partner Airlines', time: '13h 45m', price: 890, type: 'Direct (Non-stop)', tag: 'time' },
    { id: 1, provider: 'Singapore Airlines First/Biz Class', time: '14h 10m', price: 1150, type: 'Direct Premium', tag: 'comfort' },
    { id: 2, provider: 'Qatar Airways', time: '17h 00m', price: 640, type: '1 Stop via Doha', tag: 'price' },
  ];

  // Transfer options
  const transferOptions = [
    { id: 0, provider: 'Express Rail Link', time: '25m', price: 25, type: 'Direct Airport Rail', tag: 'time' },
    { id: 1, provider: 'Premium Executive Private Car', time: '35m', price: 95, type: 'Chauffeur Driven', tag: 'comfort' },
    { id: 2, provider: 'Airport Shuttle Bus', time: '50m', price: 15, type: 'Shared Transit', tag: 'price' },
  ];

  const [selectedInbound, setSelectedInbound] = useState(0);
  const [selectedInter, setSelectedInter] = useState(0);
  const [selectedOutbound, setSelectedOutbound] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(0);

  // Preset switch handler
  const handleApplyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'time') {
      setSelectedInbound(0);
      setSelectedInter(0);
      setSelectedOutbound(0);
      setSelectedTransfer(0);
    } else if (preset === 'comfort') {
      setSelectedInbound(1);
      setSelectedInter(1);
      setSelectedOutbound(1);
      setSelectedTransfer(1);
    } else if (preset === 'price') {
      setSelectedInbound(2);
      setSelectedInter(2);
      setSelectedOutbound(2);
      setSelectedTransfer(2);
    }
  };

  // Calculate live total cost
  const totalCost = 
    inboundOptions[selectedInbound].price + 
    (stops.length > 1 ? interCityOptions[selectedInter].price : 0) +
    outboundOptions[selectedOutbound].price + 
    transferOptions[selectedTransfer].price;

  const handleConfirm = () => {
    const bookedLegs = [
      {
        type: 'Inbound Flight',
        from: departure,
        to: firstStop,
        provider: inboundOptions[selectedInbound].provider,
        time: inboundOptions[selectedInbound].time,
        class: inboundOptions[selectedInbound].type,
        price: inboundOptions[selectedInbound].price
      },
      ...(stops.length > 1 ? [{
        type: 'Inter-City Transit',
        from: firstStop,
        to: lastStop,
        provider: interCityOptions[selectedInter].provider,
        time: interCityOptions[selectedInter].time,
        class: interCityOptions[selectedInter].type,
        price: interCityOptions[selectedInter].price
      }] : []),
      {
        type: 'Outbound Flight',
        from: lastStop,
        to: returnPlace,
        provider: outboundOptions[selectedOutbound].provider,
        time: outboundOptions[selectedOutbound].time,
        class: outboundOptions[selectedOutbound].type,
        price: outboundOptions[selectedOutbound].price
      },
      {
        type: 'Local Ground Transfer',
        from: 'Airport',
        to: 'Hotel / Venue',
        provider: transferOptions[selectedTransfer].provider,
        time: transferOptions[selectedTransfer].time,
        price: transferOptions[selectedTransfer].price
      }
    ];

    onNext({
      departure,
      returnPlace,
      startDate,
      endDate,
      destinationsList,
      primaryCity: firstStop,
      flight: inboundOptions[selectedInbound],
      transfer: transferOptions[selectedTransfer],
      bookedLegs,
      totalCost
    });
  };

  return (
    <div className="flex-col gap-6">
      {/* Header */}
      <div className="mb-4">
        <h2>Travel Optimisation</h2>
        <p className="text-body mt-2">Customise and confirm your end-to-end travel itinerary segments, dates, and transport modes.</p>
      </div>

      {/* Itinerary Context Banner */}
      {itinerary.length > 0 && (
        <Card status="premium" className="mb-6 bg-[var(--color-surface)]" style={{ border: '1px solid #0284c7' }}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="text-caption font-semibold text-primary" style={{ color: '#0284c7' }}>CONFIRMED ROUTE & STOPS</div>
              <h3 className="text-primary mt-1" style={{ fontSize: '1.25rem' }}>{destinationsList}</h3>
              <p className="text-caption mt-1">Optimising travel for {itinerary.length} selected stop{itinerary.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {stops.map((stop, i) => (
                <Badge key={i} status="default">Stop {i + 1}: {stop}</Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Trip Details & Travel Dates */}
      <Card status="standard" className="mb-6" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
        <h3 className="mb-1" style={{ fontSize: '1.2rem', color: '#0f172a' }}>Trip Locations & Travel Dates</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
          Select or type your origin and return hubs, and choose your travel dates.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Departure Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Departure Location *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7', display: 'flex', pointerEvents: 'none' }}>
                <MapPin size={18} />
              </span>
              <input 
                type="text" 
                value={departure} 
                onChange={(e) => {
                  setDeparture(e.target.value);
                  fetchDepSuggestions(e.target.value);
                }} 
                onFocus={() => { if (depSuggestions.length > 0) setDepDropdownOpen(true); }}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. London Heathrow (LHR)"
              />
              {depLoading && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />}
            </div>

            {/* Quick Location Pills for Departure */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {['London (LHR)', 'Frankfurt (FRA)', 'Singapore (SIN)', 'New York (JFK)', 'Tokyo (HND)'].map(hub => (
                <button
                  key={hub}
                  type="button"
                  onClick={() => setDeparture(hub)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    background: departure === hub ? '#e0f2fe' : '#f8fafc',
                    color: departure === hub ? '#0369a1' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {hub}
                </button>
              ))}
            </div>

            {depDropdownOpen && depSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)', listStyle: 'none', margin: '4px 0 0', padding: '6px 0'
              }}>
                {depSuggestions.map((s, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDeparture(s.display);
                      setDepDropdownOpen(false);
                    }}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.875rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <MapPin size={14} style={{ color: '#0284c7' }} />
                    <span>{s.display}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Return Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Return Location *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7', display: 'flex', pointerEvents: 'none' }}>
                <MapPin size={18} />
              </span>
              <input 
                type="text" 
                value={returnPlace} 
                onChange={(e) => {
                  setReturnPlace(e.target.value);
                  fetchRetSuggestions(e.target.value);
                }}
                onFocus={() => { if (retSuggestions.length > 0) setRetDropdownOpen(true); }}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. London Heathrow (LHR)"
              />
              {retLoading && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />}
            </div>

            {/* Quick Location Pills for Return */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {['London (LHR)', 'Frankfurt (FRA)', 'Singapore (SIN)', 'New York (JFK)', 'Tokyo (HND)'].map(hub => (
                <button
                  key={hub}
                  type="button"
                  onClick={() => setReturnPlace(hub)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    background: returnPlace === hub ? '#e0f2fe' : '#f8fafc',
                    color: returnPlace === hub ? '#0369a1' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {hub}
                </button>
              ))}
            </div>

            {retDropdownOpen && retSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)', listStyle: 'none', margin: '4px 0 0', padding: '6px 0'
              }}>
                {retSuggestions.map((s, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setReturnPlace(s.display);
                      setRetDropdownOpen(false);
                    }}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.875rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <MapPin size={14} style={{ color: '#0284c7' }} />
                    <span>{s.display}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Start Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Travel Start Date *
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              onClick={(e) => { try { e.target.showPicker(); } catch {} }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#0f172a',
                background: '#ffffff',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* End Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Travel End Date (Optional)
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              onClick={(e) => { try { e.target.showPicker(); } catch {} }}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#0f172a',
                background: '#ffffff',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Preset Strategy Buttons */}
      <div className="flex gap-3 mb-2 flex-wrap">
        <Button 
          variant={activePreset === 'time' ? 'primary' : 'secondary'} 
          onClick={() => handleApplyPreset('time')}
        >
          <Clock size={16}/> Optimise for Speed (Fastest)
        </Button>
        <Button 
          variant={activePreset === 'comfort' ? 'primary' : 'secondary'} 
          onClick={() => handleApplyPreset('comfort')}
        >
          <ShieldCheck size={16}/> Optimise for Comfort (Direct & Executive)
        </Button>
        <Button 
          variant={activePreset === 'price' ? 'primary' : 'secondary'} 
          onClick={() => handleApplyPreset('price')}
        >
          <Ticket size={16}/> Optimise for Price (Best Value)
        </Button>
      </div>

      {/* Journey Segments Selection */}
      <h3 className="mt-4 mb-2">Journey Segments ({stops.length > 1 ? 'Multi-Stop Trip' : 'Direct Journey'})</h3>
      
      <div className="flex-col gap-6">
        {/* Segment 1: Inbound Flight */}
        <div className="flex-col gap-2">
          <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
            Segment 1: Inbound Flight — {departure} ➔ {firstStop}
          </h4>
          {inboundOptions.map(option => (
            <Card 
              key={option.id} 
              status={selectedInbound === option.id ? 'success' : 'standard'}
              className="cursor-pointer transition-all hover-border-primary mb-2"
              onClick={() => setSelectedInbound(option.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Plane size={22} style={{ color: '#0284c7' }} />
                  <div>
                    <div className="font-semibold text-primary">{option.provider}</div>
                    <div className="text-caption mt-0.5">{option.type} &bull; {option.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {option.tag === activePreset && <Badge status="live">Recommended for {activePreset}</Badge>}
                  <div className="text-price">${option.price}</div>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    border: selectedInbound === option.id ? '2px solid #059669' : '2px solid #cbd5e1',
                    background: selectedInbound === option.id ? '#059669' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {selectedInbound === option.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }}></div>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Optional Segment: Inter-city transit for multi-stop */}
        {stops.length > 1 && (
          <div className="flex-col gap-2 mt-2">
            <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
              Segment 2: Inter-City Connection — {firstStop} ➔ {lastStop}
            </h4>
            {interCityOptions.map(option => (
              <Card 
                key={option.id} 
                status={selectedInter === option.id ? 'success' : 'standard'}
                className="cursor-pointer transition-all hover-border-primary mb-2"
                onClick={() => setSelectedInter(option.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Train size={22} style={{ color: '#0284c7' }} />
                    <div>
                      <div className="font-semibold text-primary">{option.provider}</div>
                      <div className="text-caption mt-0.5">{option.type} &bull; {option.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {option.tag === activePreset && <Badge status="live">Recommended</Badge>}
                    <div className="text-price">${option.price}</div>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                      border: selectedInter === option.id ? '2px solid #059669' : '2px solid #cbd5e1',
                      background: selectedInter === option.id ? '#059669' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {selectedInter === option.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }}></div>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Outbound Return Flight */}
        <div className="flex-col gap-2 mt-2">
          <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
            Segment {stops.length > 1 ? '3' : '2'}: Outbound Return Flight — {lastStop} ➔ {returnPlace}
          </h4>
          {outboundOptions.map(option => (
            <Card 
              key={option.id} 
              status={selectedOutbound === option.id ? 'success' : 'standard'}
              className="cursor-pointer transition-all hover-border-primary mb-2"
              onClick={() => setSelectedOutbound(option.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Plane size={22} style={{ color: '#0284c7', transform: 'rotate(180deg)' }} />
                  <div>
                    <div className="font-semibold text-primary">{option.provider}</div>
                    <div className="text-caption mt-0.5">{option.type} &bull; {option.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {option.tag === activePreset && <Badge status="live">Recommended</Badge>}
                  <div className="text-price">${option.price}</div>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    border: selectedOutbound === option.id ? '2px solid #059669' : '2px solid #cbd5e1',
                    background: selectedOutbound === option.id ? '#059669' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {selectedOutbound === option.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }}></div>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Local Transfer */}
        <div className="flex-col gap-2 mt-2">
          <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
            Segment {stops.length > 1 ? '4' : '3'}: Destination Airport &bull; Hotel Transfer ({firstStop})
          </h4>
          {transferOptions.map(option => (
            <Card 
              key={option.id} 
              status={selectedTransfer === option.id ? 'success' : 'standard'}
              className="cursor-pointer transition-all hover-border-primary mb-2"
              onClick={() => setSelectedTransfer(option.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Bus size={22} style={{ color: '#0284c7' }} />
                  <div>
                    <div className="font-semibold text-primary">{option.provider}</div>
                    <div className="text-caption mt-0.5">{option.type} &bull; {option.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {option.tag === activePreset && <Badge status="live">Recommended</Badge>}
                  <div className="text-price">${option.price}</div>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    border: selectedTransfer === option.id ? '2px solid #059669' : '2px solid #cbd5e1',
                    background: selectedTransfer === option.id ? '#059669' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {selectedTransfer === option.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }}></div>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Total Cost Summary Bar & Action */}
        <div className="mt-6 flex justify-between items-center bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-card-border)] flex-wrap gap-4">
          <div>
            <div className="text-caption font-semibold uppercase tracking-wider" style={{ color: '#0284c7' }}>Total Journey Package Cost</div>
            <div className="text-price mt-1" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
              ${totalCost}
            </div>
            <div className="text-caption mt-0.5" style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Includes all flights, inter-city legs, and local ground transfers
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <CheckCircle2 size={18} />
            <span>Confirm & Book Complete Journey</span>
          </button>
        </div>
      </div>
    </div>
  );
};
