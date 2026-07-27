import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { QrCode, Wallet, Download, Calendar, MapPin } from 'lucide-react';

export const TravelPass = ({ onNext, itinerary = [], booking }) => {
  const primaryCity = itinerary.length > 0 && itinerary[0]?.venue?.city 
    ? itinerary[0].venue.city 
    : 'Singapore';

  const mainEvent = itinerary.find(e => e.type === 'main_conference' || e.source === 'private_trip') || itinerary[0];

  return (
    <div className="flex-col gap-6">
      <div className="mb-4">
        <h2>Unified evago TravelPass</h2>
        <p className="text-body mt-2">All your tickets, flight passes, and event entry codes in one dynamic QR pass.</p>
      </div>

      <div className="flex justify-center mb-6">
        <Card status="premium" className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-between items-center w-full">
             <div className="text-primary font-bold tracking-wider">EVAGO PASS</div>
             <Badge status="success">Active Pass</Badge>
          </div>
          
          <div className="flex justify-center mb-6 border-2 border-[var(--color-card-border)] p-4 rounded-lg bg-white">
            <QrCode size={160} className="text-primary" />
          </div>
          
          <h3 className="mb-1 text-primary">Alex Mercer</h3>
          <p className="text-caption mb-6">{primaryCity} Trip &bull; {itinerary.length} Linked Items</p>

          <div className="flex-col gap-2 text-left mb-6">
            {/* Render actual events from itinerary */}
            {itinerary.map(item => (
              <div key={item.id} className="flex justify-between items-center text-body border-b border-[var(--color-card-border)] pb-2">
                <div>
                  <div className="text-secondary font-medium">{item.name}</div>
                  {item.venue?.fullAddress && (
                    <div className="text-caption" style={{ fontSize: '11px' }}>{item.venue.fullAddress}</div>
                  )}
                </div>
                <Badge status="confirmed">Access Granted</Badge>
              </div>
            ))}

            {/* Render flight booking if confirmed */}
            {booking?.flight && (
              <div className="flex justify-between items-center text-body border-b border-[var(--color-card-border)] py-2">
                <div>
                  <div className="text-secondary font-medium">{booking.flight.provider}</div>
                  <div className="text-caption" style={{ fontSize: '11px' }}>{booking.departure} → {primaryCity}</div>
                </div>
                <Badge status="live">Boarding Pass</Badge>
              </div>
            )}

            {/* Render transfer if booked */}
            {booking?.transfer && (
              <div className="flex justify-between items-center text-body pt-2">
                <div>
                  <div className="text-secondary font-medium">{booking.transfer.provider}</div>
                  <div className="text-caption" style={{ fontSize: '11px' }}>{booking.transfer.time} Transfer</div>
                </div>
                <Badge status="confirmed">Voucher Ready</Badge>
              </div>
            )}
          </div>

          <div className="flex-col gap-2 mt-4">
            <Button variant="primary" className="w-full">
              <Wallet size={16}/> Add to Apple Wallet
            </Button>
            <Button variant="secondary" className="w-full">
              <Download size={16}/> Save as PWA
            </Button>
          </div>
        </Card>
      </div>
      
      <div className="flex justify-center">
        <Button variant="ghost" onClick={onNext}>Need inter-event transport? Book a Charter Car</Button>
      </div>
    </div>
  );
};
