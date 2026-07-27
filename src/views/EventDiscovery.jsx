import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { MapPin, Calendar, Clock, ArrowRight, Link as LinkIcon, CheckCircle2, Loader2, Globe, Plus, Minus, Lock, Unlock, X } from 'lucide-react';
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

  // Private Trip State (Multiple Destinations)
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [destInputText, setDestInputText] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [destHighlight, setDestHighlight] = useState(-1);
  const [destRect, setDestRect] = useState({ top: 0, left: 0, width: 0 });
  const destDebounceRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    };
  }, []);
  const destInputRef = useRef(null);
  const destDropdownRef = useRef(null);

  const addDestination = (destName) => {
    const trimmed = (destName || '').trim();
    if (!trimmed) return;
    if (!selectedDestinations.includes(trimmed)) {
      setSelectedDestinations(prev => [...prev, trimmed]);
    }
    setDestInputText('');
    setDestDropdownOpen(false);
    setDestSuggestions([]);
  };

  const removeDestination = (indexToRemove) => {
    setSelectedDestinations(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const updateDestRect = useCallback(() => {
    if (destInputRef.current) {
      const r = destInputRef.current.getBoundingClientRect();
      setDestRect({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
    }
  }, []);

  // Reposition dropdown on scroll or resize
  useEffect(() => {
    if (!destDropdownOpen) return;
    window.addEventListener('scroll', updateDestRect, true);
    window.addEventListener('resize', updateDestRect);
    return () => {
      window.removeEventListener('scroll', updateDestRect, true);
      window.removeEventListener('resize', updateDestRect);
    };
  }, [destDropdownOpen, updateDestRect]);

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
        const data = await evagoApi.autocompleteDestinations(query);
        const suggestions = (data.suggestions || []).slice(0, 6);
        setDestSuggestions(suggestions);
        if (suggestions.length > 0) {
          updateDestRect();
          setDestDropdownOpen(true);
        } else {
          setDestDropdownOpen(false);
        }
        setDestHighlight(-1);
      } catch (err) {
        console.error('Destination autocomplete error:', err);
        setDestSuggestions([]);
        setDestDropdownOpen(false);
      } finally {
        setDestLoading(false);
      }
    }, 300);
  }, [updateDestRect]);

  const handleDestKeyDown = (e) => {
    if (destDropdownOpen && destSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDestHighlight(h => Math.min(h + 1, destSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setDestHighlight(h => Math.max(h - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (destHighlight >= 0 && destSuggestions[destHighlight]) {
          addDestination(destSuggestions[destHighlight].display);
        } else if (destInputText.trim()) {
          addDestination(destInputText);
        }
      } else if (e.key === 'Escape') {
        setDestDropdownOpen(false);
      }
    } else if (e.key === 'Enter' && destInputText.trim()) {
      e.preventDefault();
      addDestination(destInputText);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        destInputRef.current && !destInputRef.current.contains(e.target) &&
        (!destDropdownRef.current || !destDropdownRef.current.contains(e.target))
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
    if (selectedDestinations.length === 0) return;
    
    const tripEvents = selectedDestinations.map((dest, idx) => ({
      id: `trip-${Date.now()}-${idx}`,
      name: `Trip to ${dest}`,
      type: 'main_conference',
      source: 'private_trip',
      venue: {
        city: dest.split(',')[0].trim(),
        fullAddress: dest
      }
    }));
    
    setItinerary(tripEvents);
    onNext(tripEvents);
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
        <Card status="standard" className="mb-6" style={{ overflow: 'visible', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Globe size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>Plan a Private Trip</h3>
              <p className="text-body" style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                Build a multi-stop or single trip itinerary by adding destination cities or airport codes.
              </p>
            </div>
          </div>

          <div className="flex-col gap-5 mt-5" style={{ maxWidth: '640px' }}>
            {/* Added Destination Tags List */}
            {selectedDestinations.length > 0 ? (
              <div style={{
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#0284c7', textTransform: 'uppercase' }}>
                    Your Route ({selectedDestinations.length} Stop{selectedDestinations.length > 1 ? 's' : ''})
                  </span>
                  <button 
                    type="button"
                    onClick={() => setSelectedDestinations([])}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Clear all
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedDestinations.map((dest, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        background: '#ffffff',
                        border: '1px solid #93c5fd',
                        borderRadius: '20px',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#0369a1',
                      }}
                    >
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <span>{dest}</span>
                      <button
                        type="button"
                        onClick={() => removeDestination(idx)}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#64748b',
                          marginLeft: '2px',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                        title="Remove stop"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                No destinations added yet. Type a city or airport code below to start!
              </div>
            )}

            {/* Input & Add Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                Add City or Airport Code *
              </label>
              
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#0284c7',
                    display: 'flex',
                    pointerEvents: 'none'
                  }}>
                    <MapPin size={18} />
                  </span>

                  <input
                    ref={destInputRef}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    placeholder="e.g. Frankfurt, Tokyo, SIN, or FRA..."
                    value={destInputText}
                    autoComplete="off"
                    spellCheck="false"
                    onChange={e => {
                      setDestInputText(e.target.value);
                      fetchDestinationSuggestions(e.target.value);
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                      if (destSuggestions.length > 0) setDestDropdownOpen(true);
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                    onKeyDown={handleDestKeyDown}
                  />

                  {destLoading && (
                    <span style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none', display: 'flex', color: '#0284c7'
                    }}>
                      <Loader2 size={16} className="animate-spin" />
                    </span>
                  )}

                  {/* Dropdown Suggestions */}
                  {destDropdownOpen && destSuggestions.length > 0 && (
                    <ul
                      ref={destDropdownRef}
                      style={{
                        position: 'fixed',
                        top: destRect.top + 4,
                        left: destRect.left,
                        width: destRect.width,
                        zIndex: 99999,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.16)',
                        listStyle: 'none',
                        margin: 0,
                        padding: '6px 0',
                        maxHeight: '240px',
                        overflowY: 'auto',
                      }}
                    >
                      {destSuggestions.map((s, idx) => (
                        <li
                          key={idx}
                          onMouseDown={e => {
                            e.preventDefault();
                            addDestination(s.display);
                          }}
                          onMouseEnter={() => setDestHighlight(idx)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            backgroundColor: destHighlight === idx ? '#f0f9ff' : '#ffffff',
                            color: '#0f172a',
                            fontSize: '14px',
                            lineHeight: '1.4',
                          }}
                        >
                          <MapPin size={15} style={{ flexShrink: 0, color: '#0284c7' }} />
                          <span style={{ flex: 1 }}>{s.display}</span>
                          {s.iata && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#e0f2fe',
                              color: '#0369a1',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {s.iata}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (destInputText.trim()) addDestination(destInputText);
                  }}
                  onClick={() => {
                    if (destInputText.trim()) addDestination(destInputText);
                  }}
                  disabled={!destInputText.trim()}
                  style={{
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: destInputText.trim() ? '#0284c7' : '#e2e8f0',
                    color: destInputText.trim() ? '#ffffff' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: destInputText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: destInputText.trim() ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
                  }}
                >
                  <Plus size={16} /> Add Stop
                </button>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              disabled={selectedDestinations.length === 0}
              onClick={handleCreatePrivateTrip}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '14px 24px',
                borderRadius: '8px',
                border: 'none',
                background: selectedDestinations.length > 0 
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                  : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: selectedDestinations.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: selectedDestinations.length > 0 
                  ? '0 4px 14px rgba(2, 132, 199, 0.35)' 
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Start Planning Trip</span>
              {selectedDestinations.length > 0 && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem'
                }}>
                  {selectedDestinations.length} Stop{selectedDestinations.length > 1 ? 's' : ''}
                </span>
              )}
              <ArrowRight size={18} />
            </button>
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

    </div>
  );
};
