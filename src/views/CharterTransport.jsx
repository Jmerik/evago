import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Car, Route } from 'lucide-react';

export const CharterTransport = () => {
  return (
    <div className="flex-col gap-6">
      <div className="mb-4">
        <h2>Charter & Private Transport</h2>
        <p className="text-body mt-2">Book inter-event cars or premium private transfers.</p>
      </div>

      <div className="flex-col gap-4">
        <Card status="success">
          <div className="flex justify-between items-center mb-2">
            <Badge status="success">Organizer Sponsored</Badge>
            <div className="text-price">Free</div>
          </div>
          <h3 className="text-primary mt-2">Official Shuttle Fleet</h3>
          
          <div className="flex items-center gap-4 text-body mt-4 bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-card-border)]">
            <span className="font-medium text-primary">Marina Bay Sands</span>
            <Route size={16} className="text-tertiary" />
            <span className="font-medium text-primary">Fullerton Hotel</span>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2 text-caption">
              <Car size={16} /> Departs every 15 mins
            </div>
            <Button variant="primary">Add to Pass</Button>
          </div>
        </Card>

        <Card status="premium">
          <div className="flex justify-between items-center mb-2">
            <Badge status="default">Premium Upgrade</Badge>
            <div className="text-price">$120</div>
          </div>
          <h3 className="text-primary mt-2">Dedicated VIP Transport</h3>
          <p className="text-caption mt-2">Your own private driver on standby for the entire event day. Seamless travel between venues.</p>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2 text-caption">
              <Car size={16} /> Mercedes S-Class or similar
            </div>
            <Button variant="secondary">Book VIP Car</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
