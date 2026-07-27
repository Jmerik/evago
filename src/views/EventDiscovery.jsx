import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { MapPin, Calendar, Clock, ArrowRight, Link as LinkIcon, CheckCircle2, Loader2, Globe, Plus, Minus, Lock, Unlock } from 'lucide-react';
import { evagoApi } from '../services/api';

export const EventDiscovery = ({ onNext }) => {
  const [activeMode, setActiveMode] = useState('manual'); // 'luma', 'manual', 'custom', 'private_trip'
  
  // Luma Sync State
  const [connectionState, setConnectionState] = useState('disconnected');
  const [apiKey, setApiKey] = useState('');
  const [lumaEvents, setLumaEvents] = useState({ main: null, sideEvents: [] });
  const [lumaError, setLumaError] = useState('');

  // Manual Browse State
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionEvents, setRegionEvents] = useState([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [itinerary, setItinerary] = useState([]);

  // Custom Event State
  const [customForm, setCustomForm] = useState({
    name: '',
    date: '',
    time: '',
    region: '',
    address: '',
    visibility: 'private' // 'private' or 'public'
  });
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Private Trip State
  const [privateTripForm, setPrivateTripForm] = useState({
    destination: '',
    startDate: '',
    endDate: ''
  });
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [destHighlight, setDestHighlight] = useState(-1);
  const destDebounceRef = useRef(null);
  const destInputRef = useRef(null);
  const destDropdownRef = useRef(null);

  const fetchDestinationSuggestions = useCallback((query) => {
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    if (!query || query.length < 2) {
      setDestSuggestions([]);
      setDestDropdownOpen(false);
      return;
    }
    destDebounceRef.current = setTimeout(async () => {
      setDestLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
        );
        const data = await res.json();
        const suggestions = (data.features || [])
          .filter(f => ['city', 'town', 'village', 'county', 'state', 'country'].includes(f.properties?.type))
          .map(f => {
            const p = f.properties || {};
            const city = p.name || p.city || '';
            const country = p.country || '';
            const state = p.state || '';
            let display = city;
            if (state && state !== city) display += `, ${state}`;
            if (country && country !== city) display += `, ${country}`;
            return { display, city, country, lat: f.geometry?.coordinates?.[1], lon: f.geometry?.coordinates?.[0] };
          })
          .filter((s, idx, arr) => s.display && arr.findIndex(x => x.display === s.display) === idx);
        setDestSuggestions(suggestions);
        setDestDropdownOpen(suggestions.length > 0);
        setDestHighlight(-1);
      } catch (err) {
        console.error('Destination autocomplete error:', err);
        setDestSuggestions([]);
        setDestDropdownOpen(false);
      } finally {
        setDestLoading(false);
      }
    }, 300);
  }, []);

  const handleDestKeyDown = (e) => {
    if (!destDropdownOpen || destSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestHighlight(h => Math.min(h + 1, destSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && destHighlight >= 0) {
      e.preventDefault();
      const s = destSuggestions[destHighlight];
      setPrivateTripForm(f => ({ ...f, destination: s.display }));
      setDestDropdownOpen(false);
      setDestSuggestions([]);
    } else if (e.key === 'Escape') {
      setDestDropdownOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        destInputRef.current && !destInputRef.current.contains(e.target) &&
        destDropdownRef.current && !destDropdownRef.current.contains(e.target)
      ) {
        setDestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load regions on mount
  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    setIsLoadingRegions(true);
    try {
      const res = await evagoApi.getRegions();
      setRegions(res.regions || []);
    } catch (err) {
      console.error('Failed to load regions:', err);
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const handleSelectRegion = async (region) => {
    setSelectedRegion(region);
    setIsLoadingEvents(true);
    setRegionEvents([]);
    try {
      const res = await evagoApi.getEventsByRegion(region.region);
      setRegionEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey) return;
    setConnectionState('connecting');
    setLumaError('');
    try {
      await evagoApi.validateLumaKey(apiKey);
      const res = await evagoApi.fetchLumaEvents(apiKey);
      const mainEvent = res.events.find(e => e.type === 'main_conference');
      const sideEvents = res.events.filter(e => e.type !== 'main_conference');
      setLumaEvents({ main: mainEvent, sideEvents });
      setConnectionState('connected');
    } catch (err) {
      setLumaError(err.message || 'Failed to connect');
      setConnectionState('disconnected');
    }
  };

  const handleCreateCustomEvent = async () => {
    if (!customForm.name || !customForm.date || !customForm.region) return;
    
    setIsSubmittingCustom(true);
    let finalEvent = {
      name: customForm.name,
      type: 'side_event',
      source: 'custom_private',
      startAt: `${customForm.date}T${customForm.time || '00:00'}:00Z`,
      region: customForm.region,
      venue: {
        fullAddress: customForm.address || 'TBA',
        city: customForm.region
      }
    };
    
    if (customForm.visibility === 'public') {
      try {
        const res = await evagoApi.createCustomEvent(finalEvent);
        finalEvent = res.event; // Get the generated ID and standard format
      } catch (err) {
        console.error('Failed to create public event:', err);
        setIsSubmittingCustom(false);
        return;
      }
    } else {
      finalEvent.id = `custom-private-${Date.now()}`;
    }
    
    toggleItinerary(finalEvent);
    setActiveMode('manual');
    setCustomForm({ name: '', date: '', time: '', region: '', address: '', visibility: 'private' });
    setIsSubmittingCustom(false);
  };

  const handleCreatePrivateTrip = () => {
    if (!privateTripForm.destination || !privateTripForm.startDate) return;
    
    // Instead of adding an event to itinerary, we can pass a dummy "trip" 
    // object so the next screen knows what's up, but since the MVP assumes
    // an array of events, we'll wrap it as a single multi-day event.
    const privateTripEvent = {
      id: `trip-${Date.now()}`,
      name: `Trip to ${privateTripForm.destination}`,
      type: 'main_conference', // use this style so it stands out
      source: 'private_trip',
      startAt: `${privateTripForm.startDate}T00:00:00Z`,
      endAt: privateTripForm.endDate ? `${privateTripForm.endDate}T23:59:59Z` : undefined,
      venue: {
        city: privateTripForm.destination,
        fullAddress: privateTripForm.destination
      }
    };
    
    // Clear itinerary and use only this trip
    setItinerary([privateTripEvent]);
    onNext([privateTripEvent]);
  };

  const toggleItinerary = (event) => {
    setItinerary(prev => {
      const exists = prev.find(e => e.id === event.id);
      if (exists) return prev.filter(e => e.id !== event.id);
      return [...prev, event];
    });
  };

  const isInItinerary = (eventId) => itinerary.some(e => e.id === eventId);

  const getEventTypeLabel = (type) => {
    const map = {
      main_conference: 'Conference',
      side_event: 'Side Event',
      networking: 'Networking',
      workshop: 'Workshop',
      vip_dinner: 'VIP Dinner',
    };
    return map[type] || type;
  };

  const getEventTypeStatus = (type) => {
    const map = {
      main_conference: 'live',
      side_event: 'default',
      networking: 'success',
      workshop: 'alert',
      vip_dinner: 'premium',
    };
    return map[type] || 'default';
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    if (iso.includes('00:00:00Z') && !iso.includes('T00:00')) return ''; // Skip time if midnight exact
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const mainConferences = regionEvents.filter(e => e.type === 'main_conference');
  const sideEvents = regionEvents.filter(e => e.type !== 'main_conference');

  // Filter out private events from itinerary to show them below
  const privateEvents = itinerary.filter(e => e.source === 'custom_private');
  // Public custom events pulled from DB have source 'custom_public' and are shown inline with regionEvents

  return (
    <div className="flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2>Event Discovery</h2>
          <p className="text-body mt-2">Find conferences, sync your calendar, or plan a private trip.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeMode === 'manual' ? 'primary' : 'secondary'} onClick={() => setActiveMode('manual')}>
            <Globe size={16} /> Browse
          </Button>
          <Button variant={activeMode === 'luma' ? 'primary' : 'secondary'} onClick={() => setActiveMode('luma')}>
            <LinkIcon size={16} /> Luma Sync
          </Button>
          <Button variant={activeMode === 'custom' ? 'primary' : 'secondary'} onClick={() => setActiveMode('custom')}>
            <Plus size={16} /> Custom Event
          </Button>
          <Button variant={activeMode === 'private_trip' ? 'primary' : 'secondary'} onClick={() => setActiveMode('private_trip')}>
            Private Itinerary
          </Button>
        </div>
      </div>

      {/* ─── PRIVATE ITINERARY MODE ─── */}
      {activeMode === 'private_trip' && (
        <Card status="standard" className="mb-6">
          <h3 className="mb-4">Plan a Private Trip</h3>
          <p className="text-body mb-6">Skip the events list and just plan travel for a business trip or leisure getaway.</p>
          
          <div className="flex-col gap-4 max-w-lg">
            <div className="flex-col gap-1" style={{ position: 'relative' }}>
              <label className="text-caption font-semibold text-primary">Destination *</label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={destInputRef}
                  type="text"
                  className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                  style={{ width: '100%', paddingRight: destLoading ? '2.5rem' : '1rem' }}
                  placeholder="e.g. Tokyo, Japan"
                  value={privateTripForm.destination}
                  autoComplete="off"
                  onChange={e => {
                    setPrivateTripForm(f => ({ ...f, destination: e.target.value }));
                    fetchDestinationSuggestions(e.target.value);
                  }}
                  onFocus={() => {
                    if (destSuggestions.length > 0) setDestDropdownOpen(true);
                  }}
                  onKeyDown={handleDestKeyDown}
                />
                {destLoading && (
                  <span style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)'
                  }}>
                    <Loader2 size={16} className="animate-spin" />
                  </span>
                )}
                {destDropdownOpen && destSuggestions.length > 0 && (
                  <ul
                    ref={destDropdownRef}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: 'var(--color-surface, #fff)',
                      border: '1px solid var(--color-card-border)',
                      borderRadius: '0.5rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      listStyle: 'none',
                      margin: 0,
                      padding: '0.25rem 0',
                      maxHeight: '220px',
                      overflowY: 'auto',
                    }}
                  >
                    {destSuggestions.map((s, idx) => (
                      <li
                        key={idx}
                        onMouseDown={e => {
                          e.preventDefault();
                          setPrivateTripForm(f => ({ ...f, destination: s.display }));
                          setDestDropdownOpen(false);
                          setDestSuggestions([]);
                          destInputRef.current?.focus();
                        }}
                        onMouseEnter={() => setDestHighlight(idx)}
                        style={{
                          padding: '0.625rem 1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: destHighlight === idx ? 'var(--color-primary-subtle, #f0f4ff)' : 'transparent',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.875rem',
                          transition: 'background 0.12s',
                        }}
                      >
                        <MapPin size={14} style={{ flexShrink: 0, color: 'var(--color-primary, #4f6ef7)' }} />
                        <span>{s.display}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-col gap-1 flex-1">
                <label className="text-caption font-semibold text-primary">Start Date *</label>
                <input 
                  type="date" 
                  className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                  value={privateTripForm.startDate}
                  onChange={e => setPrivateTripForm({...privateTripForm, startDate: e.target.value})}
                />
              </div>
              <div className="flex-col gap-1 flex-1">
                <label className="text-caption font-semibold text-primary">End Date (Optional)</label>
                <input 
                  type="date" 
                  className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                  value={privateTripForm.endDate}
                  onChange={e => setPrivateTripForm({...privateTripForm, endDate: e.target.value})}
                />
              </div>
            </div>

            <Button 
              variant="primary" 
              className="mt-4 w-full"
              disabled={!privateTripForm.destination || !privateTripForm.startDate}
              onClick={handleCreatePrivateTrip}
            >
              Start Planning Trip <ArrowRight size={16} className="ml-2 inline" />
            </Button>
          </div>
        </Card>
      )}

      {/* ─── CUSTOM EVENT MODE ─── */}
      {activeMode === 'custom' && (
        <Card status="standard" className="mb-6">
          <h3 className="mb-4">Create Custom Event</h3>
          <p className="text-body mb-6">Add an unlisted event. You can keep it private or share it publicly with other EVAGO users.</p>
          
          <div className="flex-col gap-4 max-w-lg">
            <div className="flex-col gap-1">
              <label className="text-caption font-semibold text-primary">Event Name / Purpose *</label>
              <input 
                type="text" 
                className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                placeholder="e.g. VC Networking Dinner"
                value={customForm.name}
                onChange={e => setCustomForm({...customForm, name: e.target.value})}
              />
            </div>

            <div className="flex-col gap-1">
              <label className="text-caption font-semibold text-primary">Region *</label>
              <select 
                className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                value={customForm.region}
                onChange={e => setCustomForm({...customForm, region: e.target.value})}
              >
                <option value="">Select a region...</option>
                {regions.map(r => (
                  <option key={r.region} value={r.region}>{r.city}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-col gap-1 flex-1">
                <label className="text-caption font-semibold text-primary">Date *</label>
                <input 
                  type="date" 
                  className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                  value={customForm.date}
                  onChange={e => setCustomForm({...customForm, date: e.target.value})}
                />
              </div>
              <div className="flex-col gap-1 flex-1">
                <label className="text-caption font-semibold text-primary">Time</label>
                <input 
                  type="time" 
                  className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                  value={customForm.time}
                  onChange={e => setCustomForm({...customForm, time: e.target.value})}
                />
              </div>
            </div>

            <div className="flex-col gap-1">
              <label className="text-caption font-semibold text-primary">Address</label>
              <input 
                type="text" 
                className="p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary bg-white"
                placeholder="e.g. The Fullerton Hotel"
                value={customForm.address}
                onChange={e => setCustomForm({...customForm, address: e.target.value})}
              />
            </div>

            <div className="flex gap-4 mt-2">
              <div 
                className={`flex-1 p-3 border rounded-md cursor-pointer flex items-center justify-center gap-2 transition-colors ${customForm.visibility === 'private' ? 'border-[var(--color-primary)] bg-[var(--color-surface)]' : 'border-[var(--color-card-border)]'}`}
                onClick={() => setCustomForm({...customForm, visibility: 'private'})}
              >
                <Lock size={16} className={customForm.visibility === 'private' ? 'text-primary' : 'text-body'} />
                <span className={customForm.visibility === 'private' ? 'font-semibold text-primary' : 'text-body'}>Private</span>
              </div>
              <div 
                className={`flex-1 p-3 border rounded-md cursor-pointer flex items-center justify-center gap-2 transition-colors ${customForm.visibility === 'public' ? 'border-[var(--color-primary)] bg-[var(--color-surface)]' : 'border-[var(--color-card-border)]'}`}
                onClick={() => setCustomForm({...customForm, visibility: 'public'})}
              >
                <Globe size={16} className={customForm.visibility === 'public' ? 'text-primary' : 'text-body'} />
                <span className={customForm.visibility === 'public' ? 'font-semibold text-primary' : 'text-body'}>Public (Share)</span>
              </div>
            </div>

            <Button 
              variant="primary" 
              className="mt-4 w-full"
              disabled={!customForm.name || !customForm.date || !customForm.region || isSubmittingCustom}
              onClick={handleCreateCustomEvent}
            >
              {isSubmittingCustom ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Add to Itinerary'}
            </Button>
          </div>
        </Card>
      )}

      {/* ─── MANUAL BROWSE MODE ─── */}
      {activeMode === 'manual' && (
        <div className="flex-col gap-6">
          {!selectedRegion && (
            <>
              <h3>Select a Region</h3>
              <p className="text-body">Choose a region to browse conferences and side events from our partner organizers.</p>
              {isLoadingRegions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={28} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {regions.map((r) => (
                    <Card
                      key={r.region}
                      status="standard"
                      className="cursor-pointer"
                      onClick={() => handleSelectRegion(r)}
                      style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                          <Globe size={20} />
                        </div>
                        <div>
                          <h4 className="text-primary">{r.city}</h4>
                          <p className="text-caption">{r.country}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedRegion && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => { setSelectedRegion(null); setRegionEvents([]); }}>
                    ← Regions
                  </Button>
                  <h3>{selectedRegion.city}, {selectedRegion.country}</h3>
                  <Badge status="default">{regionEvents.length} events</Badge>
                </div>
              </div>

              {isLoadingEvents ? (
                <div className="flex-col items-center justify-center py-12 text-center">
                  <Loader2 size={28} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                  <p className="text-caption mt-4">Loading events from partner calendars...</p>
                </div>
              ) : (
                <>
                  {mainConferences.length > 0 && (
                    <>
                      <h3 className="mt-4">Conferences</h3>
                      <div className="flex-col gap-4">
                        {mainConferences.map((event) => (
                          <Card key={event.id} status={isInItinerary(event.id) ? 'success' : 'premium'}>
                            <div className="flex justify-between items-center">
                              <div className="flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge status={getEventTypeStatus(event.type)}>{getEventTypeLabel(event.type)}</Badge>
                                  {event.organizerCalendar && (
                                    <span className="text-caption">via {event.organizerCalendar}</span>
                                  )}
                                </div>
                                <h3>{event.name}</h3>
                                <div className="flex gap-4 text-caption mt-1">
                                  <span className="flex items-center gap-1"><Calendar size={14}/> {formatDate(event.startAt)}</span>
                                  <span className="flex items-center gap-1"><MapPin size={14}/> {event.venue?.fullAddress}</span>
                                </div>
                              </div>
                              <Button
                                variant={isInItinerary(event.id) ? 'secondary' : 'primary'}
                                onClick={() => toggleItinerary(event)}
                              >
                                {isInItinerary(event.id) ? (
                                  <><Minus size={16} /> Remove</>
                                ) : (
                                  <><Plus size={16} /> Add to Itinerary</>
                                )}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}

                  {sideEvents.length > 0 && (
                    <>
                      <h3 className="mt-6">Side Events, Workshops & Community</h3>
                      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {sideEvents.map((event) => (
                          <Card key={event.id} status={isInItinerary(event.id) ? 'success' : 'standard'}>
                            <div className="flex justify-between items-center mb-2">
                              <Badge status={getEventTypeStatus(event.type)}>
                                {event.source === 'custom_public' ? 'Community Event' : getEventTypeLabel(event.type)}
                              </Badge>
                              {event.source === 'custom_public' && (
                                <Unlock size={14} className="text-body" title="Public Custom Event" />
                              )}
                            </div>
                            <h4 className="text-primary mt-2">{event.name}</h4>
                            <div className="text-caption mt-2 flex-col gap-1">
                              <span className="flex items-center gap-1"><Clock size={14}/> {formatDate(event.startAt)}, {formatTime(event.startAt)}</span>
                              <span className="flex items-center gap-1"><MapPin size={14}/> {event.venue?.fullAddress}</span>
                            </div>
                            {event.organizerCalendar && (
                              <p className="text-caption mt-2" style={{ fontSize: '11px', opacity: 0.6 }}>via {event.organizerCalendar}</p>
                            )}
                            {event.source === 'custom_public' && (
                              <p className="text-caption mt-2" style={{ fontSize: '11px', opacity: 0.6 }}>Added by EVAGO User</p>
                            )}
                            <Button
                              variant={isInItinerary(event.id) ? 'secondary' : 'primary'}
                              className="mt-4 w-full"
                              onClick={() => toggleItinerary(event)}
                            >
                              {isInItinerary(event.id) ? 'Remove from Itinerary' : 'Add to Itinerary'}
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}

                  {regionEvents.length === 0 && (
                    <p className="text-body text-center mt-8">No events found for this region yet. Check back soon.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── LUMA SYNC MODE ─── */}
      {activeMode === 'luma' && (
        <>
          {connectionState === 'disconnected' && (
            <Card status="standard" className="mb-6 bg-[var(--color-surface)] border-dashed border-2 border-[var(--color-card-border)] items-center justify-center py-12 text-center">
              <div className="flex-col items-center gap-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-white border border-[var(--color-card-border)] flex items-center justify-center mb-2">
                  <LinkIcon size={24} className="text-primary" />
                </div>
                <h3 className="text-primary">Connect your Luma Account</h3>
                <p className="text-body mb-4">Enter your Luma Calendar API Key to sync your personal RSVP'd events.</p>
                {lumaError && <p style={{ color: '#DC2626', fontSize: '14px' }} className="mb-2">{lumaError}</p>}
                <div className="flex w-full gap-2">
                  <input
                    type="password"
                    placeholder="x-luma-api-key"
                    className="flex-1 p-3 border border-[var(--color-card-border)] rounded-md outline-none text-primary"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleConnect} disabled={!apiKey}>Connect</Button>
                </div>
                <p className="text-caption mt-2">Enter <strong>test-key</strong> for demo mode.</p>
              </div>
            </Card>
          )}

          {connectionState === 'connecting' && (
            <Card status="standard" className="mb-6 items-center justify-center py-12 text-center">
              <div className="flex-col items-center gap-4">
                <Loader2 size={32} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                <h4 className="text-primary">Syncing with Luma...</h4>
                <p className="text-caption">Fetching your events and RSVP status</p>
              </div>
            </Card>
          )}

          {connectionState === 'connected' && lumaEvents.main && (
            <>
              <Badge status="success" className="flex items-center gap-1 mb-2">
                <CheckCircle2 size={14} /> Luma Connected
              </Badge>
              <Card status="premium" className="mb-6">
                <div className="flex justify-between items-center">
                  <div className="flex-col gap-2">
                    <Badge status="live">{lumaEvents.main.rsvpStatus}</Badge>
                    <h3>{lumaEvents.main.name}</h3>
                    <div className="flex gap-4 text-caption mt-2">
                      <span className="flex items-center gap-1"><MapPin size={16}/> {lumaEvents.main.venue?.fullAddress}</span>
                      <span className="flex items-center gap-1"><Calendar size={16}/> {formatDate(lumaEvents.main.startAt)}</span>
                    </div>
                  </div>
                  <Button variant="primary" onClick={onNext}>Plan Travel <ArrowRight size={16} /></Button>
                </div>
              </Card>

              {lumaEvents.sideEvents.length > 0 && (
                <>
                  <h3 className="mb-4">Synced Side Events</h3>
                  <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {lumaEvents.sideEvents.map((event) => (
                      <Card key={event.id} status="success">
                        <Badge status="success">{event.rsvpStatus}</Badge>
                        <h4 className="text-primary mt-2">{event.name}</h4>
                        <div className="text-caption mt-2 flex gap-4">
                          <span className="flex items-center gap-1"><Clock size={16}/> {formatTime(event.startAt)}</span>
                          <span className="flex items-center gap-1"><MapPin size={16}/> {event.venue?.city}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ─── YOUR ITINERARY SUMMARY ─── */}
      {itinerary.length > 0 && activeMode !== 'private_trip' && (
        <div className="mt-8 pt-6 border-t border-[var(--color-card-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3>Your Itinerary ({itinerary.length})</h3>
            <Button variant="primary" onClick={() => onNext(itinerary)}>
              Plan Travel for {itinerary.length} Events <ArrowRight size={16} />
            </Button>
          </div>
          
          {privateEvents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-body font-semibold mb-2">Private Events</h4>
              <div className="flex-col gap-2">
                {privateEvents.map(event => (
                  <div key={event.id} className="flex justify-between items-center bg-white p-3 rounded-md border border-[var(--color-card-border)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-body" />
                        <p className="font-semibold text-primary">{event.name}</p>
                      </div>
                      <p className="text-caption mt-1">{formatDate(event.startAt)} • {event.venue.fullAddress}</p>
                    </div>
                    <Button variant="secondary" onClick={() => toggleItinerary(event)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};
