import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { QrCode, Wallet, Download } from 'lucide-react';

export const TravelPass = ({ onNext }) => {
  return (
    <div className="flex-col gap-6">
      <div className="mb-4">
        <h2>Unified evago TravelPass</h2>
        <p className="text-body mt-2">All your tickets and access passes in one dynamic QR code.</p>
      </div>

      <div className="flex justify-center mb-6">
        <Card status="premium" className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-between items-center w-full">
             <div className="text-primary font-bold">EVAGO PASS</div>
             <Badge status="success">Active</Badge>
          </div>
          
          <div className="flex justify-center mb-6 border-2 border-[var(--color-card-border)] p-4 rounded-lg">
            <QrCode size={160} className="text-primary" />
          </div>
          
          <h3 className="mb-2 text-primary">Alex Mercer</h3>
          <p className="text-caption mb-6">TOKEN2049 Delegate &bull; Sep 18 - 19</p>

          <div className="flex-col gap-2 text-left mb-6">
            <div className="flex justify-between items-center text-body border-b border-[var(--color-card-border)] pb-2">
              <span className="text-secondary">Main Conference</span>
              <Badge status="confirmed">Access Granted</Badge>
            </div>
            <div className="flex justify-between items-center text-body border-b border-[var(--color-card-border)] py-2">
              <span className="text-secondary">VC Breakfast</span>
              <Badge status="confirmed">Access Granted</Badge>
            </div>
            <div className="flex justify-between items-center text-body pt-2">
              <span className="text-secondary">Inbound Flight</span>
              <Badge status="live">Boarding at 14:00</Badge>
            </div>
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
