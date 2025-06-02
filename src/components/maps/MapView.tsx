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
          // Hide all points of interest
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
          },
          // Hide business labels
          {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }]
          },
          // Hide transit stations
          {
            featureType: "transit.station",
            stylers: [{ visibility: "off" }]
          },
          // Simplify road labels
          {
            featureType: "road",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }]
          },
          // Light background
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }]
          },
          // Light water
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9d6e5" }]
          },
          // Subtle roads
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#e8e8e8" }]
          },
          // Minimal labels with good contrast
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#666666" }]
          },
          {
            featureType: "all",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#ffffff" }, { weight: 2 }]
          },
          // Light parks/landscape
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f0f0f0" }]
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry",
            stylers: [{ color: "#e8f5e8" }]
          },
          // Subtle administrative boundaries
          {
            featureType: "administrative",
            elementType: "geometry.stroke",
            stylers: [{ color: "#cccccc" }, { weight: 0.5 }]
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
        
        // Truncate place name if too long for better display
        const displayName = place.name.length > 20 ? place.name.substring(0, 17) + '...' : place.name;
        
        const marker = new google.maps.Marker({
          position,
          map,
          title: place.name,
          animation: google.maps.Animation.DROP,
          label: {
            text: displayName,
            color: '#1f2937',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <circle cx="20" cy="20" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
            labelOrigin: new google.maps.Point(20, 45)
          }
        });
        
        markersRef.current.push(marker);
        
        // Create info window content
        const contentString = `
          <div class="p-3 max-w-xs">
            <h3 class="text-lg font-semibold mb-1">${place.name}</h3>
            <p class="text-sm mb-2">${place.address}</p>
            ${place.rating ? `<p class="text-sm">Rating: ${place.rating.toFixed(1)}/5</p>` : ''}
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