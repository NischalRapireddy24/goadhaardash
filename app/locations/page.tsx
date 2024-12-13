'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '~/hooks/useFirebase';
import AdminMap from '~/components/AdminMap';
import Link from 'next/link';

export default function LocationsPage() {
  const { getFarmerLocations, addFakeLocation } = useFirebase();
  const [locations, setLocations] = useState<{
    id: string;
    name: string;
    location: string;
    agentName: string;
  }[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const fetchedLocations = await getFarmerLocations();
    setLocations(fetchedLocations);
  };

  const handleAddLocation = async (location: string) => {
    try {
      await addFakeLocation({
        name: `Test Farmer ${locations.length + 1}`,
        location,
        agentName: 'Admin'
      });
      await loadLocations();
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Location Management
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Click on the map to add new locations
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
          <AdminMap 
            farmers={locations} 
            onAddLocation={handleAddLocation}
          />
        </div>

        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Added Locations ({locations.length})
          </h2>
          <div className="grid gap-4">
            {locations.map((loc) => (
              <div 
                key={loc.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{loc.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Location: {loc.location}
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Added by: {loc.agentName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 