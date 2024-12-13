import { useEffect, useState } from 'react';
import { Wrapper } from '@googlemaps/js-api-loader';
import MapComponent from './Map';

interface MapWrapperProps {
  farmers: {
    id: string;
    name: string;
    location: string;
    agentName: string;
  }[];
}

export default function MapWrapper({ farmers }: MapWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loader = new Wrapper({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      setIsLoaded(true);
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="text-slate-600 dark:text-slate-300">Loading map...</div>
      </div>
    );
  }

  return <MapComponent farmers={farmers} />;
} 