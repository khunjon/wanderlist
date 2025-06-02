'use client';

import { useEffect, useRef } from 'react';
import { Place } from '@/types';

interface MapViewProps {
  places: Place[];
}

export default function MapView({ places }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMapsAPI = () => {
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        console.error('Google Maps API key is missing');
        return;
      }
      
      // Check if the Google Maps script is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }
      
      // Create a script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      
      document.head.appendChild(script);
    };
    
    const initializeMap = () => {
      if (!mapRef.current || places.length === 0 || !window.google) return;
      
      // Get the center of the map (average of all place coordinates)
      const bounds = new google.maps.LatLngBounds();
      
      // Create a new map instance
      const mapOptions: google.maps.MapOptions = {
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { 
            featureType: "all", 
            elementType: "labels.text.fill", 
            stylers: [{ color: "#ffffff" }] 
          },
          { 
            featureType: "all", 
            elementType: "labels.text.stroke", 
            stylers: [{ color: "#000000" }, { lightness: 13 }] 
          },
          { 
            featureType: "administrative", 
            elementType: "geometry.fill", 
            stylers: [{ color: "#000000" }] 
          },
          { 
            featureType: "administrative", 
            elementType: "geometry.stroke", 
            stylers: [{ color: "#144b53" }, { lightness: 14 }, { weight: 1.4 }] 
          },
          { 
            featureType: "landscape", 
            elementType: "all", 
            stylers: [{ color: "#08304b" }] 
          },
          { 
            featureType: "poi", 
            elementType: "geometry", 
            stylers: [{ color: "#0c4152" }, { lightness: 5 }] 
          },
          { 
            featureType: "road.highway", 
            elementType: "geometry.fill", 
            stylers: [{ color: "#000000" }] 
          },
          { 
            featureType: "road.highway", 
            elementType: "geometry.stroke", 
            stylers: [{ color: "#0b434f" }, { lightness: 25 }] 
          },
          { 
            featureType: "road.arterial", 
            elementType: "geometry.fill", 
            stylers: [{ color: "#000000" }] 
          },
          { 
            featureType: "road.arterial", 
            elementType: "geometry.stroke", 
            stylers: [{ color: "#0b3d51" }, { lightness: 16 }] 
          },
          { 
            featureType: "road.local", 
            elementType: "geometry", 
            stylers: [{ color: "#000000" }] 
          },
          { 
            featureType: "transit", 
            elementType: "all", 
            stylers: [{ color: "#146474" }] 
          },
          { 
            featureType: "water", 
            elementType: "all", 
            stylers: [{ color: "#021019" }] 
          }
        ]
      };
      
      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
      const map = mapInstanceRef.current;
      
      // Create info window for showing place details
      const infoWindow = new google.maps.InfoWindow();
      
      // Clear any existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Add markers for each place
      places.forEach((place, index) => {
        const position = {
          lat: place.latitude,
          lng: place.longitude
        };
        
        bounds.extend(position);
        
        const marker = new google.maps.Marker({
          position,
          map,
          title: place.name,
          animation: google.maps.Animation.DROP,
          label: {
            text: `${index + 1}`,
            color: 'white'
          }
        });
        
        markersRef.current.push(marker);
        
        // Create info window content
        const contentString = `
          <div class="p-3 max-w-xs">
            <h3 class="text-lg font-semibold mb-1">${place.name}</h3>
            <p class="text-sm mb-2">${place.address}</p>
            ${place.rating ? `<p class="text-sm">Rating: ${place.rating.toFixed(1)}/5</p>` : ''}
            ${place.photoUrl ? `<img src="${place.photoUrl}" alt="${place.name}" class="mt-2 w-full h-32 object-cover rounded" />` : ''}
          </div>
        `;
        
        // Add click event to marker
        marker.addListener('click', () => {
          infoWindow.setContent(contentString);
          infoWindow.open(map, marker);
        });
      });
      
      // Fit the map to show all markers
      map.fitBounds(bounds);
      
      // Adjust zoom if too close
      const mapInstance = map; // Store reference to ensure it's stable in the callback
      const listener = google.maps.event.addListener(mapInstance, 'idle', () => {
        const currentZoom = mapInstance.getZoom();
        if (currentZoom !== undefined && currentZoom > 16) {
          mapInstance.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    };
    
    loadGoogleMapsAPI();
    
    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [places]);
  
  return (
    <div ref={mapRef} className="w-full h-full" />
  );
} 