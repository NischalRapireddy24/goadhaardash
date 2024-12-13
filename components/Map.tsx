import { useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapProps {
  farmers: {
    id: string;
    name: string;
    location: string;
    agentName: string;
  }[];
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 15.9129,
  lng: 79.7400
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function MapComponent({ farmers }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries
  });

  // Parse location strings to coordinates
  const farmerMarkers = farmers
    .filter(farmer => farmer.location && farmer.location.includes(','))
    .map(farmer => {
      try {
        const [latitude, longitude] = farmer.location.split(',');
        const lat = parseFloat(latitude.trim());
        const lng = parseFloat(longitude.trim());
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates for farmer ${farmer.id}`);
          return null;
        }

        return {
          id: farmer.id,
          position: { lat, lng }
        };
      } catch (error) {
        console.warn(`Error parsing coordinates for farmer ${farmer.id}:`, error);
        return null;
      }
    })
    .filter((marker): marker is { id: string; position: { lat: number; lng: number } } => 
      marker !== null
    );

  console.log('Parsed markers:', farmerMarkers); // Debug log

  const onLoad = useCallback((map: google.maps.Map) => {
    if (farmerMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      farmerMarkers.forEach(marker => bounds.extend(marker.position));
      map.fitBounds(bounds);
    }
  }, [farmerMarkers]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={farmerMarkers[0]?.position || defaultCenter}
      zoom={farmerMarkers.length > 0 ? undefined : 8}
      onLoad={onLoad}
      options={{
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {farmerMarkers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#1d4ed8',
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
} 