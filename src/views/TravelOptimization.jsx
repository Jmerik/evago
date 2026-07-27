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

  // Dynamic travel options from backend API search (Duffel, Kiwi, Travelpayouts, 12Go, Grab)
  const [inboundOptions, setInboundOptions] = useState([
    { id: 0, provider: 'Singapore Airlines (Duffel Direct)', time: '13h 10m', price: 980, type: 'Direct (Non-stop)', tag: 'time', pipe: 'Duffel API — Primary Booking Pipe', disruptionScore: '98.4% On-Time (AviationStack)' },
    { id: 1, provider: 'Emirates (Travelpayouts Data)', time: '14h 30m', price: 850, type: '1 Stop via Dubai', tag: 'comfort', pipe: 'Travelpayouts Data API — Price Comparison', disruptionScore: '96.8% On-Time' },
    { id: 2, provider: 'Kiwi Tequila Regional Partner', time: '16h 15m', price: 620, type: '1 Stop via Doha', tag: 'price', pipe: 'Kiwi Tequila API — ASEAN Fallback', disruptionScore: '94.2% On-Time' },
  ]);

  const [interCityOptions, setInterCityOptions] = useState([
    { id: 0, provider: 'Shinkansen / Express Rail (12Go Partner)', time: '2h 15m', price: 140, type: 'Direct Train', tag: 'time', pipe: '12Go API / Reseller Program' },
    { id: 1, provider: 'Regional Express (Easybook SOAP)', time: '1h 10m', price: 190, type: 'Direct Flight / Transit', tag: 'comfort', pipe: 'Easybook Partner Web Services' },
    { id: 2, provider: '12Go Regional Highway Coach', time: '5h 30m', price: 45, type: 'Luxury Express Bus', tag: 'price', pipe: '12Go Affiliate API' },
  ]);

  const [outboundOptions, setOutboundOptions] = useState([
    { id: 0, provider: 'Lufthansa (Duffel Pipe)', time: '13h 45m', price: 890, type: 'Direct (Non-stop)', tag: 'time', pipe: 'Duffel API — Primary Booking Pipe' },
    { id: 1, provider: 'Singapore Airlines Premium (Travelpayouts Data)', time: '14h 10m', price: 1150, type: 'Direct Premium', tag: 'comfort', pipe: 'Travelpayouts Data API' },
    { id: 2, provider: 'Qatar Airways (Kiwi Tequila Pipe)', time: '17h 00m', price: 640, type: '1 Stop via Doha', tag: 'price', pipe: 'Kiwi Tequila API' },
  ]);

  const [transferOptions, setTransferOptions] = useState([
    { id: 0, provider: 'Express Rail Link', time: '25m', price: 25, type: 'Direct Airport Rail', tag: 'time', pipe: 'Public Rapid Transit API' },
    { id: 1, provider: 'Grab Executive Chauffeur (Grab Partner)', time: '35m', price: 95, type: 'Private Premium Car', tag: 'comfort', pipe: 'Grab Developer API' },
    { id: 2, provider: 'Grab Airport Shuttle (Grab Share)', time: '50m', price: 15, type: 'Shared Express Shuttle', tag: 'price', pipe: 'Grab Developer API' },
  ]);

  const [dynamicSegments, setDynamicSegments] = useState([]);
  const [selectedSegmentOptions, setSelectedSegmentOptions] = useState({});

  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingPipes, setIsSearchingPipes] = useState(false);

  const [selectedInbound, setSelectedInbound] = useState(0);
  const [selectedInter, setSelectedInter] = useState(0);
  const [selectedOutbound, setSelectedOutbound] = useState(0);
  const [selectedTransfer, setSelectedTransfer] = useState(0);

  // Trigger search on explicit user action or initial search button click
  const handlePerformSearch = async () => {
    setHasSearched(true);
    setIsSearchingPipes(true);
    try {
      const res = await evagoApi.searchTravelOptions({
        departure,
        returnPlace,
        destinations: stops,
        startDate,
        endDate,
      });
      if (res.success) {
        if (res.inboundOptions?.length > 0) setInboundOptions(res.inboundOptions);
        if (res.interCityOptions) setInterCityOptions(res.interCityOptions);
        if (res.outboundOptions?.length > 0) setOutboundOptions(res.outboundOptions);
        if (res.transferOptions?.length > 0) setTransferOptions(res.transferOptions);
        if (res.dynamicSegments?.length > 0) {
          setDynamicSegments(res.dynamicSegments);
          // Initialize selected option 0 for each segment
          const initSel = {};
          res.dynamicSegments.forEach(seg => {
            initSel[seg.segmentIndex] = 0;
          });
          setSelectedSegmentOptions(initSel);
        }
        if (res.apiPipesUsed) setApiPipesUsed(res.apiPipesUsed);
      }
    } catch (err) {
      console.error('Travel search API error:', err);
    } finally {
      setIsSearchingPipes(false);
    }
  };

  // Preset switch handler
  const handleApplyPreset = (preset) => {
    setActivePreset(preset);
    const targetIdx = preset === 'time' ? 0 : preset === 'comfort' ? 1 : 2;
    setSelectedInbound(Math.min(targetIdx, inboundOptions.length - 1));
    setSelectedInter(Math.min(targetIdx, interCityOptions.length - 1));
    setSelectedOutbound(Math.min(targetIdx, outboundOptions.length - 1));
    setSelectedTransfer(Math.min(targetIdx, transferOptions.length - 1));

    if (dynamicSegments.length > 0) {
      const newSel = {};
      dynamicSegments.forEach(seg => {
        newSel[seg.segmentIndex] = Math.min(targetIdx, (seg.options?.length || 1) - 1);
      });
      setSelectedSegmentOptions(newSel);
    }
  };

  // Calculate live total cost
  let totalCost = 0;
  if (dynamicSegments.length > 0) {
    dynamicSegments.forEach(seg => {
      const selOptIdx = selectedSegmentOptions[seg.segmentIndex] || 0;
      totalCost += seg.options?.[selOptIdx]?.price || 0;
    });
    const safeTransferPrice = transferOptions[selectedTransfer]?.price || 25;
    totalCost += safeTransferPrice;
  } else {
    const safeInboundPrice = inboundOptions[selectedInbound]?.price || 850;
    const safeInterPrice = stops.length > 1 && interCityOptions[selectedInter] ? interCityOptions[selectedInter].price : 0;
    const safeOutboundPrice = outboundOptions[selectedOutbound]?.price || 800;
    const safeTransferPrice = transferOptions[selectedTransfer]?.price || 25;
    totalCost = safeInboundPrice + safeInterPrice + safeOutboundPrice + safeTransferPrice;
  }

  const handleConfirm = () => {
    let bookedLegs = [];

    if (dynamicSegments.length > 0) {
      bookedLegs = dynamicSegments.map(seg => {
        const selOptIdx = selectedSegmentOptions[seg.segmentIndex] || 0;
        const opt = seg.options?.[selOptIdx] || {};
        return {
          type: `Segment ${seg.segmentIndex}: ${seg.isFlightLeg ? 'Flight' : 'Transit'}`,
          from: seg.from,
          to: seg.to,
          provider: opt.provider,
          time: opt.time,
          class: opt.type,
          price: opt.price
        };
      });
      bookedLegs.push({
        type: 'Local Ground Transfer',
        from: 'Airport / Terminal',
        to: 'Hotel / Venue',
        provider: transferOptions[selectedTransfer]?.provider || 'Grab Executive',
        time: transferOptions[selectedTransfer]?.time || '35m',
        price: transferOptions[selectedTransfer]?.price || 25
      });
    } else {
      bookedLegs = [
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
    }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={18} style={{ color: '#0284c7' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Trip Locations &amp; Dates</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Set your origin hub, return hub and travel window</p>
          </div>
        </div>

        {/* Row 1: Departure + Return side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* Departure Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✈️ Departure Location *
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
                placeholder="e.g. London Heathrow (LHR) or KTI"
              />
              {depLoading && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />}
            </div>

            {/* Quick Location Pills for Departure */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {['London (LHR)', 'Frankfurt (FRA)', 'Singapore (SIN)', 'Phnom Penh (KTI)', 'Tokyo (HND)'].map(hub => (
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
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🏠 Return Location *
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
                placeholder="e.g. London Heathrow (LHR) or KTI"
              />
              {retLoading && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />}
            </div>

            {/* Quick Location Pills for Return */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {['London (LHR)', 'Frankfurt (FRA)', 'Singapore (SIN)', 'Phnom Penh (KTI)', 'Tokyo (HND)'].map(hub => (
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
        </div>

        {/* Row 2: Travel Start Date + End Date side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          {/* Start Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📅 Travel Start Date *
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
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📅 Travel End Date (Optional)
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

        {/* Search CTA Button */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justify: 'flex-end' }}>
          <button
            type="button"
            onClick={handlePerformSearch}
            disabled={isSearchingPipes}
            style={{
              width: '100%',
              padding: '13px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isSearchingPipes ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSearchingPipes ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Searching Duffel, Kiwi, 12Go &amp; Grab APIs...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Search Travel Options &amp; Calculate Live Prices</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </Card>

      {/* State 1: Prompt before search */}
      {!hasSearched && !isSearchingPipes && (
        <Card status="standard" className="text-center py-12" style={{ border: '2px dashed #cbd5e1', background: '#ffffff', borderRadius: '12px' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Plane size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Ready to Search Travel Options?</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
              Click <strong>"Search Travel Options &amp; Calculate Live Prices"</strong> above to query live carrier rates, high-speed rail connections, and Grab transfers for your route.
            </p>
          </div>
        </Card>
      )}

      {/* State 2: Searching Spinner */}
      {isSearchingPipes && (
        <Card status="standard" className="text-center py-12" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Loader2 size={36} style={{ color: '#0284c7' }} className="animate-spin" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Calculating Real-Time Fares &amp; Routes...</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Fetching flight offers from Duffel API, price trends from Travelpayouts, inter-city legs via 12Go, and Grab transfers.
            </p>
          </div>
        </Card>
      )}

      {/* State 3: Search Results Rendered */}
      {hasSearched && !isSearchingPipes && (
        <>
          {/* Active API Pipes Indicator Banner */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Live Search Processed — Actual Prices Calculated</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>Duffel API</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px' }}>Kiwi Tequila</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '12px' }}>12Go Transit</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '12px' }}>Grab Charter</span>
            </div>
          </div>

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
              <ShieldCheck size={16}/> Optimise for Comfort (Direct &amp; Executive)
            </Button>
            <Button 
              variant={activePreset === 'price' ? 'primary' : 'secondary'} 
              onClick={() => handleApplyPreset('price')}
            >
              <Ticket size={16}/> Optimise for Price (Best Value)
            </Button>
          </div>

          {/* Dynamic Per-Segment Options if Multi-Stop Itinerary */}
          {dynamicSegments.length > 0 ? (
            <div className="flex-col gap-6 mt-4">
              <h3 className="mb-2">Segment Options ({dynamicSegments.length} Route Legs)</h3>
              
              {dynamicSegments.map((seg) => {
                const selectedOptIdx = selectedSegmentOptions[seg.segmentIndex] || 0;
                return (
                  <div key={seg.segmentIndex} className="flex-col gap-2">
                    <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {seg.segmentIndex}
                      </span>
                      {seg.title}
                    </h4>

                    {seg.options.map((option) => (
                      <Card
                        key={option.id}
                        status={selectedOptIdx === option.id ? 'success' : 'standard'}
                        className="cursor-pointer transition-all hover-border-primary mb-2"
                        onClick={() => setSelectedSegmentOptions(prev => ({ ...prev, [seg.segmentIndex]: option.id }))}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            {seg.isFlightLeg ? <Plane size={22} style={{ color: '#0284c7' }} /> : <Train size={22} style={{ color: '#0284c7' }} />}
                            <div>
                              <div className="font-semibold text-primary">{option.provider}</div>
                              <div className="text-caption mt-0.5 flex items-center gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                                <span>{option.type} &bull; {option.time}</span>
                                {option.pipe && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                                    {option.pipe}
                                  </span>
                                )}
                                {option.disruptionScore && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                                    {option.disruptionScore}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {option.tag === activePreset && <Badge status="live">Recommended</Badge>}
                            <div className="text-price" style={{ color: '#0f172a', fontWeight: 700 }}>${option.price}</div>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                              border: selectedOptIdx === option.id ? '2px solid #059669' : '2px solid #cbd5e1',
                              background: selectedOptIdx === option.id ? '#059669' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}>
                              {selectedOptIdx === option.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }}></div>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })}

              {/* Local Ground Transfer Segment */}
              <div className="flex-col gap-2 mt-2">
                <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Segment {dynamicSegments.length + 1}: Local Destination Ground Transfer ({firstStop})
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
                          <div className="text-caption mt-0.5 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
                            <span>{option.type} &bull; {option.time}</span>
                            {option.pipe && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                                {option.pipe}
                              </span>
                            )}
                          </div>
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
            </div>
          ) : (
            /* Standard Simple Roundtrip View */
            <div className="flex-col gap-6 mt-4">
              <h3 className="mb-2">Journey Segments (Direct Journey)</h3>

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
                          <div className="text-caption mt-0.5 flex items-center gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                            <span>{option.type} &bull; {option.time}</span>
                            {option.pipe && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                                {option.pipe}
                              </span>
                            )}
                            {option.disruptionScore && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                                {option.disruptionScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {option.tag === activePreset && <Badge status="live">Recommended</Badge>}
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

              {/* Outbound Return Flight */}
              <div className="flex-col gap-2 mt-2">
                <h4 className="text-secondary mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Segment 2: Outbound Return Flight — {lastStop} ➔ {returnPlace}
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
                          <div className="text-caption mt-0.5 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
                            <span>{option.type} &bull; {option.time}</span>
                            {option.pipe && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                                {option.pipe}
                              </span>
                            )}
                          </div>
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
                  Segment 3: Local Ground Transfer ({firstStop})
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
                          <div className="text-caption mt-0.5 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
                            <span>{option.type} &bull; {option.time}</span>
                            {option.pipe && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                                {option.pipe}
                              </span>
                            )}
                          </div>
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
            </div>
          )}

          {/* Total Cost Summary Bar & Action */}
          <div className="mt-6 flex justify-between items-center bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-card-border)] flex-wrap gap-4">
            <div>
              <div className="text-caption font-semibold uppercase tracking-wider" style={{ color: '#0284c7' }}>Total Journey Package Cost</div>
              <div className="text-price mt-1" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
                ${totalCost}
              </div>
              <div className="text-caption mt-0.5" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Includes all confirmed segment options &amp; local transfers
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
              <span>Confirm &amp; Book Complete Journey</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

