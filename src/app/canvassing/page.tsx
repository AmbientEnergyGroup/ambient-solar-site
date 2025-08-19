"use client";

import { useState, useEffect, useRef } from "react";
import MessagesButton from "@/components/MessagesButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { BarChart3, Users, LogOut, Home, Map, Search, Plus, Filter, ZoomIn, ZoomOut, Layers, X, PenTool, Save } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Script from 'next/script';
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import dynamic from 'next/dynamic';

// Dynamically import heavy components
const ClientOnly = dynamic(() => import('@/components/ClientOnly'), { ssr: false });

// Remove the modified declaration and revert to original
declare global {
  interface Window {
    google: typeof google;
  }
}

// User data type that includes userRole
interface ExtendedUserData {
  id: string;
  role: 'admin' | 'user';
  displayName: string;
  email: string;
  createdAt: string;
  active: boolean;
  userRole?: string;
}

// Interface for a canvassing area
interface CanvassingArea {
  id: string;
  name: string;
  description: string;
  color: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  createdBy?: string; // ID of the manager who created this area
}

// Interface for a home in a canvassing area
interface Home {
  id: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  status?: 'not_interested' | 'appointment_set' | 'sold' | 'not_home' | null;
  areaId: string;
}

// Mock homes data
const mockHomes: Home[] = [
  {
    id: "h1",
    address: "123 Main St, North Valley, CA 91001",
    position: { lat: 34.225, lng: -118.515 },
    areaId: "1"
  },
  {
    id: "h2",
    address: "456 Oak Ave, North Valley, CA 91001",
    position: { lat: 34.220, lng: -118.510 },
    areaId: "1"
  },
  {
    id: "h3",
    address: "789 Elm St, Downtown Area, CA 91002",
    position: { lat: 34.185, lng: -118.480 },
    areaId: "2"
  },
  {
    id: "h4",
    address: "321 Pine Rd, West Hills, CA 91003",
    position: { lat: 34.195, lng: -118.625 },
    areaId: "3"
  }
];

// Define empty initial areas
const initialAreas: CanvassingArea[] = [];

export default function Canvassing() {
  const [areas, setAreas] = useState<CanvassingArea[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<CanvassingArea | null>(null);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [areasSidebarOpen, setAreasSidebarOpen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const drawingManagerRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = useState(12);
  const [mapType, setMapType] = useState<'satellite' | 'styled'>('satellite');
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [newPolygon, setNewPolygon] = useState<google.maps.Polygon | null>(null);
  const [showAreaNameModal, setShowAreaNameModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaDescription, setNewAreaDescription] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode } = useTheme();
  const [showPinSuccess, setShowPinSuccess] = useState(false);
  const [lastPinPosition, setLastPinPosition] = useState<{lat: number, lng: number} | null>(null);

  const auth = useAuth();
  const { user, loading, signOut, userData } = auth || {};
  const router = useRouter();

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is a manager
  const isManager = () => {
    if (!userData) return false;
    const ud = userData as ExtendedUserData;
    return ud.role === 'admin' || ud.userRole === 'Self Gen';
  };

  // Swipe gesture handlers for mobile sidebar
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe && areasSidebarOpen) {
      setAreasSidebarOpen(false);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Function to refresh areas data - improved to handle empty data case
  const refreshAreas = () => {
    if (typeof window === 'undefined') return; // Prevent localStorage access during SSR
    
    try {
      const savedAreas = localStorage.getItem('canvassingAreas');
      if (savedAreas) {
        const parsedAreas = JSON.parse(savedAreas);
        setAreas(parsedAreas);
        console.log("Loaded areas from localStorage:", parsedAreas.length);
      } else {
        // Create a sample area if none exist
        const sampleArea = {
          id: "1",
          name: "Sample Area",
          description: "This is a sample area to get you started",
          color: darkMode ? "#F59E0B" : "#3B82F6", // Amber or Blue based on theme
          coordinates: [
            { lat: 34.225, lng: -118.545 },
            { lat: 34.235, lng: -118.545 },
            { lat: 34.235, lng: -118.525 },
            { lat: 34.225, lng: -118.525 }
          ],
          createdBy: user?.uid || "system"
        };
        localStorage.setItem('canvassingAreas', JSON.stringify([sampleArea]));
        setAreas([sampleArea]);
        console.log("Created sample area in localStorage");
      }

      const savedHomes = localStorage.getItem('canvassingHomes');
      if (savedHomes) {
        const parsedHomes = JSON.parse(savedHomes);
        setHomes(parsedHomes);
        console.log("Loaded homes from localStorage:", parsedHomes.length);
      } else {
        localStorage.setItem('canvassingHomes', JSON.stringify(mockHomes));
        setHomes(mockHomes);
        console.log("Added mock homes to localStorage:", mockHomes.length);
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // Fallback to defaults
      setAreas(initialAreas);
      setHomes(mockHomes);
    }
  };

  // Modify the map initialization to properly set up the click handler
  const initializeMap = () => {
    console.log("Initializing map, Google Maps loaded:", !!window.google);
    
    if (typeof window !== 'undefined' && window.google && !mapRef.current) {
      const mapElement = document.getElementById("map");
      if (!mapElement) {
        console.error("Map element not found in DOM");
        // Try again after a short delay
        setTimeout(initializeMap, 500);
        return;
      }
      
      console.log("Map element found, creating map");
      
      try {
        const mapOptions: google.maps.MapOptions = {
          center: { lat: 34.2, lng: -118.55 },
          zoom: currentZoom,
          mapTypeId: mapType === 'satellite' ? 'satellite' : 'roadmap',
          styles: mapType === 'styled' ? [
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [
                { "color": "#ffffff" }
              ]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.stroke",
              "stylers": [
                { "color": "#000000" },
                { "lightness": 13 }
              ]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.fill",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.stroke",
              "stylers": [
                { "color": "#144b53" },
                { "lightness": 14 },
                { "weight": 1.4 }
              ]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text",
              "stylers": [
                { "visibility": "on" },
                { "color": "#ffffff" },
                { "weight": "0.75" }
              ]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.fill",
              "stylers": [
                { "color": "#ffffff" }
              ]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.stroke",
              "stylers": [
                { "color": "#000000" },
                { "weight": "1.50" }
              ]
            },
            // Hide city names when zoomed out (below zoom level 10)
            {
              "featureType": "administrative.locality",
              "elementType": "labels",
              "stylers": [
                { 
                  "visibility": "simplified",
                  "weight": "3.00"
                }
              ]
            },
            {
              "featureType": "landscape",
              "elementType": "all",
              "stylers": [
                { "color": "#08304b" }
              ]
            },
            {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [
                { "color": "#0c4152" },
                { "lightness": 5 }
              ]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.fill",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [
                { "color": "#0b434f" },
                { "lightness": 25 }
              ]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry.fill",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry.stroke",
              "stylers": [
                { "color": "#0b3d51" },
                { "lightness": 16 }
              ]
            },
            {
              "featureType": "road.local",
              "elementType": "geometry",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "transit",
              "elementType": "all",
              "stylers": [
                { "color": "#146474" }
              ]
            },
            {
              "featureType": "water",
              "elementType": "all",
              "stylers": [
                { "color": "#021019" }
              ]
            }
          ] : undefined,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false,
        };
        
        mapRef.current = new window.google.maps.Map(mapElement, mapOptions);
        setIsMapInitialized(true);
        console.log("Map created successfully");
        
        // Important: Set up click handler as soon as map is created
        // This click handler will focus specifically on pin dropping
        window.google.maps.event.addListener(mapRef.current, 'idle', () => {
          if (mapRef.current) {
            // Set up click handler for pin dropping
            mapRef.current.addListener('click', function(event: any) {
              // Use the current value of isPinningMode when clicked
              if (isPinningMode && event.latLng) {
                console.log("Map clicked in pinning mode at:", event.latLng.toString());
                // Add the home directly without setTimeout to ensure it works
                addNewHome(event.latLng);
              }
            });
            console.log("Pin dropping click handler set up on map initialization");
          }
  
          // Now add areas and homes as before
          addAreasToMap();
          addHomesToMap();
        });
        
        // Add listeners for map events
        mapRef.current.addListener("zoom_changed", () => {
          if (mapRef.current) {
            const newZoom = mapRef.current.getZoom();
            setCurrentZoom(newZoom);
            
            // Toggle city name visibility based on zoom level
            if (mapType === 'styled') {
              const cityLabelsStyle = [
                {
                  "featureType": "administrative.locality",
                  "elementType": "labels",
                  "stylers": [
                    { "visibility": newZoom >= 10 ? "on" : "off" }
                  ]
                }
              ];
              
              mapRef.current.setOptions({
                styles: [...(mapOptions.styles || []), ...cityLabelsStyle]
              });
            }
          }
        });
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
      }
    } else {
      console.log("Map initialization skipped: Google not loaded or map already initialized");
    }
  };

  // Update the addNewHome function to retrieve the actual address
  const addNewHome = (latLng: google.maps.LatLng) => {
    // Get the exact coordinates from the click
    const exactLat = latLng.lat();
    const exactLng = latLng.lng();
    
    // Don't require area selection, but use it if available
    const areaId = selectedArea?.id || (areas.length > 0 ? areas[0].id : "unknown");
    
    // Create a temporary bouncing marker to show where the user clicked
    let tempMarker: google.maps.Marker | null = null;
    if (mapRef.current) {
      tempMarker = new window.google.maps.Marker({
        position: latLng,
        map: mapRef.current,
        animation: window.google.maps.Animation.BOUNCE
      });
    }
    
    // Get the actual address for this location
    if (window.google && window.google.maps) {
      // Try to get the address using geocoding
      // @ts-ignore - TypeScript doesn't recognize the Geocoder API
      const geocoder = new window.google.maps.Geocoder();
      // @ts-ignore - TypeScript doesn't recognize the geocode method parameters
      geocoder.geocode({ location: latLng }, (results, status) => {
        // Clean up temporary marker
        if (tempMarker) {
          tempMarker.setMap(null);
        }
        
        // Determine the address to use
        let address = `New Pin (${exactLat.toFixed(5)}, ${exactLng.toFixed(5)})`;
        
        if (status === "OK" && results && results.length > 0) {
          // Use the formatted address from geocoding results
          address = results[0].formatted_address;
          console.log("Retrieved address:", address);
        } else {
          console.log("Geocoding failed, using coordinates as address:", status);
        }
        
        // Create and add the new home with the actual address
        const newHome: Home = {
          id: `h${Date.now()}`, // Generate unique ID
          address: address,
          position: { lat: exactLat, lng: exactLng },
          areaId: areaId
        };
        
        // Update state and localStorage
        const updatedHomes = [...homes, newHome];
        setHomes(updatedHomes);
        localStorage.setItem('canvassingHomes', JSON.stringify(updatedHomes));
        
        // Add the permanent marker
        if (mapRef.current) {
          const marker = new window.google.maps.Marker({
            position: newHome.position,
            map: mapRef.current,
            title: newHome.address,
            animation: window.google.maps.Animation.DROP,
            icon: {
              url: `https://maps.google.com/mapfiles/ms/icons/${darkMode ? 'yellow' : 'blue'}-dot.png`
            },
            zIndex: 1000
          });
          
          marker.addListener("click", () => {
            console.log("Marker clicked:", newHome);
            setSelectedHome(newHome);
            setShowHomeModal(true);
          });
          
          markersRef.current.push(marker);
          
          // Show the home modal immediately
          setSelectedHome(newHome);
          setShowHomeModal(true);
          
          // Show success notification
          setLastPinPosition(newHome.position);
          setShowPinSuccess(true);
          setTimeout(() => setShowPinSuccess(false), 3000);
        }
      });
    } else {
      // Fallback if geocoder isn't available
      if (tempMarker) {
        tempMarker.setMap(null);
      }
      
      // Create a new home with generic address as fallback
      const newHome: Home = {
        id: `h${Date.now()}`,
        address: `New Pin (${exactLat.toFixed(5)}, ${exactLng.toFixed(5)})`,
        position: { lat: exactLat, lng: exactLng },
        areaId: areaId
      };
      
      const updatedHomes = [...homes, newHome];
      setHomes(updatedHomes);
      localStorage.setItem('canvassingHomes', JSON.stringify(updatedHomes));
      
      // Add a marker
      if (mapRef.current) {
        const marker = new window.google.maps.Marker({
          position: newHome.position,
          map: mapRef.current,
          title: newHome.address,
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: `https://maps.google.com/mapfiles/ms/icons/${darkMode ? 'yellow' : 'blue'}-dot.png`
          },
          zIndex: 1000
        });
        
        marker.addListener("click", () => {
          setSelectedHome(newHome);
          setShowHomeModal(true);
        });
        
        markersRef.current.push(marker);
        setSelectedHome(newHome);
        setShowHomeModal(true);
      }
    }
  };

  // Add areas to map as polygons
  const addAreasToMap = () => {
    if (!mapRef.current || !areas.length) return;

    // Clear previous polygons
    polygonsRef.current.forEach(polygon => polygon.setMap(null));
    polygonsRef.current = [];

    // Add new polygons
    areas.forEach(area => {
      const polygon = new window.google.maps.Polygon({
        paths: area.coordinates,
        strokeColor: area.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: area.color,
        fillOpacity: 0.35,
        map: mapRef.current || undefined,
      });

      // Add click listener
      polygon.addListener("click", () => {
        setSelectedArea(area);
      });

      polygonsRef.current.push(polygon);
    });
  };

  // Update the addHomesToMap function to use simpler markers
  const addHomesToMap = () => {
    if (!mapRef.current || !homes.length) return;

    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for all homes
    homes.forEach(home => {
      // Determine icon color based on status
      let markerIconUrl;
      
      switch(home.status) {
        case 'not_interested':
          markerIconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
          break;
        case 'appointment_set':
          markerIconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
          break;
        case 'sold':
          markerIconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
          break;
        case 'not_home':
          markerIconUrl = 'https://maps.google.com/mapfiles/ms/icons/grey-dot.png';
          break;
        default:
          markerIconUrl = darkMode 
            ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' 
            : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      }

      // Create marker with icon
      const marker = new window.google.maps.Marker({
        position: home.position,
        map: mapRef.current || undefined,
        title: home.address,
        icon: { url: markerIconUrl }
      });

      // Add click listener
      marker.addListener("click", () => {
        console.log("Home clicked:", home.address);
        setSelectedHome(home);
        setShowHomeModal(true);
      });

      markersRef.current.push(marker);
    });
    
    console.log(`Added ${markersRef.current.length} home markers to map`);
  };

  // Handle home status update
  const handleHomeStatusUpdate = (newStatus: 'not_interested' | 'appointment_set' | 'sold' | 'not_home' | null) => {
    if (!selectedHome) return;

    const updatedHomes = homes.map(home => 
      home.id === selectedHome.id 
        ? { ...home, status: newStatus } 
        : home
    );

    setHomes(updatedHomes);
    localStorage.setItem('canvassingHomes', JSON.stringify(updatedHomes));
    
    if (newStatus === 'appointment_set') {
      // Navigate to new set form with pre-populated address
              router.push(`/sets?address=${encodeURIComponent(selectedHome.address)}`);
    } else {
      setShowHomeModal(false);
      
      // Update the map markers
      if (mapRef.current) {
        addHomesToMap();
      }
    }
  };

  const handleDeleteHome = (homeId: string) => {
    // Remove home from the list
    const updatedHomes = homes.filter(home => home.id !== homeId);
    setHomes(updatedHomes);
    localStorage.setItem('canvassingHomes', JSON.stringify(updatedHomes));
  };

  // Fetch areas on component mount or refresh
  useEffect(() => {
    if (isClient) {
      refreshAreas();
    }
  }, [refreshKey, isClient]);

  // Initialize map when areas are loaded and Google Maps is ready
  useEffect(() => {
    if (isClient && mapLoaded && areas.length > 0) {
      console.log("Areas loaded and Google Maps ready, initializing map");
      initializeMap();
      
      // Force refresh markers after initialization with increased delay
      const timer = setTimeout(() => {
        if (mapRef.current && homes.length) {
          console.log("Refreshing home markers after delay");
          addHomesToMap();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, areas, isClient]);

  // Update map when areas change
  useEffect(() => {
    if (mapRef.current && areas.length) {
      addAreasToMap();
    }
  }, [areas]);

  // Update map when homes change
  useEffect(() => {
    if (mapRef.current && homes.length) {
      addHomesToMap();
    }
  }, [homes]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Function to handle zooming in
  const handleZoomIn = () => {
    if (mapRef.current) {
      const newZoom = Math.min((mapRef.current.getZoom() || currentZoom) + 1, 20);
      mapRef.current.setZoom(newZoom);
      setCurrentZoom(newZoom);
    }
  };

  // Function to handle zooming out
  const handleZoomOut = () => {
    if (mapRef.current) {
      const newZoom = Math.max((mapRef.current.getZoom() || currentZoom) - 1, 1);
      mapRef.current.setZoom(newZoom);
      setCurrentZoom(newZoom);
    }
  };

  // Function to toggle map type
  const toggleMapType = () => {
    if (mapRef.current) {
      const newMapType = mapType === 'satellite' ? 'styled' : 'satellite';
      setMapType(newMapType);
      
      if (newMapType === 'satellite') {
        mapRef.current.setMapTypeId('satellite');
        mapRef.current.setOptions({ styles: undefined });
      } else {
        mapRef.current.setMapTypeId('roadmap');
        mapRef.current.setOptions({
          styles: [
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [
                { "color": "#ffffff" }
              ]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.stroke",
              "stylers": [
                { "color": "#000000" },
                { "lightness": 13 }
              ]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.fill",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.stroke",
              "stylers": [
                { "color": "#144b53" },
                { "lightness": 14 },
                { "weight": 1.4 }
              ]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text",
              "stylers": [
                { "visibility": "on" },
                { "color": "#ffffff" },
                { "weight": "0.75" }
              ]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.fill",
              "stylers": [
                { "color": "#ffffff" }
              ]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.stroke",
              "stylers": [
                { "color": "#000000" },
                { "weight": "1.50" }
              ]
            },
            // Hide city names when zoomed out (below zoom level 10)
            {
              "featureType": "administrative.locality",
              "elementType": "labels",
              "stylers": [
                { 
                  "visibility": "simplified",
                  "weight": "3.00"
                }
              ]
            },
            {
              "featureType": "landscape",
              "elementType": "all",
              "stylers": [
                { "color": "#08304b" }
              ]
            },
            {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [
                { "color": "#0c4152" },
                { "lightness": 5 }
              ]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.fill",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [
                { "color": "#0b434f" },
                { "lightness": 25 }
              ]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry.fill",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry.stroke",
              "stylers": [
                { "color": "#0b3d51" },
                { "lightness": 16 }
              ]
            },
            {
              "featureType": "road.local",
              "elementType": "geometry",
              "stylers": [
                { "color": "#000000" }
              ]
            },
            {
              "featureType": "transit",
              "elementType": "all",
              "stylers": [
                { "color": "#146474" }
              ]
            },
            {
              "featureType": "water",
              "elementType": "all",
              "stylers": [
                { "color": "#021019" }
              ]
            }
          ]
        });
      }
    }
  };

  // Update the togglePinningMode function to avoid using clearListeners
  const togglePinningMode = () => {
    const newPinningMode = !isPinningMode;
    setIsPinningMode(newPinningMode);
    console.log("Pinning mode toggled:", newPinningMode ? "ON" : "OFF");
    
    // If turning on pinning mode, make sure the map click handler is working
    if (newPinningMode && mapRef.current) {
      // Add a separate click handler that will work when pinning mode is active
      mapRef.current.addListener('click', function(event: any) {
        // We'll check the current state of isPinningMode when the click happens
        if (newPinningMode && event.latLng) {
          console.log("Map clicked in refreshed pin mode at:", event.latLng.toString());
          addNewHome(event.latLng);
        }
      });
      
      console.log("Added additional click handler for pin dropping");
    }
  };

  // Toggle drawing mode for managers
  const toggleDrawingMode = () => {
    if (!isManager()) return;
    
    if (!isDrawingMode) {
      // Enable drawing mode
      if (mapRef.current && window.google?.maps) {
        // Disable pinning mode if active
        if (isPinningMode) {
          setIsPinningMode(false);
        }
        
        // Initialize drawing manager if it doesn't exist
        if (!drawingManagerRef.current) {
          // @ts-ignore - Drawing manager may not be properly typed
          drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
            // @ts-ignore
            drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
            drawingControl: false,
            polygonOptions: {
              editable: true,
              draggable: true,
              strokeColor: darkMode ? '#F59E0B' : '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: darkMode ? '#F59E0B' : '#3B82F6',
              fillOpacity: 0.35,
            }
          });
          
          // Add completion listener
          window.google.maps.event.addListener(
            drawingManagerRef.current, 
            'overlaycomplete', 
            (event: any) => {
              // @ts-ignore
              if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
                // Store the new polygon
                setNewPolygon(event.overlay as google.maps.Polygon);
                
                // Exit drawing mode
                drawingManagerRef.current?.setDrawingMode(null);
                
                // Show naming modal
                setShowAreaNameModal(true);
              }
            }
          );
        }
        
        // Set drawing mode
        drawingManagerRef.current.setMap(mapRef.current);
        // @ts-ignore
        drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        setIsDrawingMode(true);
      }
    } else {
      // Disable drawing mode
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
        drawingManagerRef.current.setMap(null);
      }
      setIsDrawingMode(false);
    }
  };
  
  // Save the new area
  const saveNewArea = () => {
    if (!newPolygon || !newAreaName) return;
    
    // Extract coordinates from the polygon path
    // @ts-ignore - getPath method may not be properly typed
    const path = newPolygon.getPath();
    const coordinates: {lat: number, lng: number}[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({
        lat: point.lat(),
        lng: point.lng()
      });
    }
    
    // Create new area with a random color
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newArea: CanvassingArea = {
      id: `area_${Date.now()}`,
      name: newAreaName,
      description: newAreaDescription || `Area created by ${user?.displayName || 'manager'}`,
      color: randomColor,
      coordinates: coordinates,
      createdBy: user?.uid
    };
    
    // Add to areas state
    const updatedAreas = [...areas, newArea];
    setAreas(updatedAreas);
    
    // Save to localStorage
    localStorage.setItem('canvassingAreas', JSON.stringify(updatedAreas));
    
    // Clean up
    newPolygon.setMap(null);
    setNewPolygon(null);
    setNewAreaName('');
    setNewAreaDescription('');
    setShowAreaNameModal(false);
    setIsDrawingMode(false);
    
    // Update map with new area
    addAreasToMap();
  };
  
  // Cancel area creation
  const cancelAreaCreation = () => {
    if (newPolygon) {
      newPolygon.setMap(null);
      setNewPolygon(null);
    }
    setNewAreaName('');
    setNewAreaDescription('');
    setShowAreaNameModal(false);
    setIsDrawingMode(false);
  };

  // Add effect to handle sidebar changes (when sidebar state changes)
  useEffect(() => {
    if (isClient && mapRef.current) {
      // Wait for DOM to update after sidebar change
      setTimeout(() => {
        // Try to reinitialize the map when the sidebar state changes
        if (!isMapInitialized) {
          initializeMap();
        } else {
          // For an already initialized map, try to update its size
          try {
            // Force redraw by causing a reflow
            const mapElement = document.getElementById("map");
            if (mapElement) {
              // This trick causes a reflow which helps Google Maps recognize size changes
              mapElement.style.display = 'none';
              // Reading offsetHeight causes a reflow
              const _ = mapElement.offsetHeight; 
              mapElement.style.display = '';
              
              console.log("Forced map container reflow");
            }
          } catch (error) {
            console.error("Error updating map after sidebar change:", error);
          }
        }
      }, 300);
    }
  }, [sidebarOpen, areasSidebarOpen, isClient, isMapInitialized]);

  // Add effect to re-initialize map if the map container becomes visible
  useEffect(() => {
    if (isClient && mapLoaded && !mapRef.current) {
      const mapContainer = document.getElementById("map");
      if (mapContainer && mapContainer.offsetParent !== null) {
        console.log("Map container is now visible, initializing map");
        initializeMap();
      }
    }
  }, [mapLoaded, isClient]);

  // Improve isPinningMode effect to ensure click handling works when mode changes
  useEffect(() => {
    console.log("Pinning mode changed:", isPinningMode ? "ON" : "OFF");
    
    // Alert user when pinning mode is activated
    if (isPinningMode) {
      console.log("Click anywhere on the map to add a house pin");
    }
  }, [isPinningMode]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'}`}></div>
      </div>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  // Filter areas based on search term
  const filteredAreas = areas.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyADMRuoIRl1-6edk8emkrZMLnp3-Ecf8A4&libraries=places,drawing,geometry&callback=Function.prototype`}
        strategy="lazyOnload"
        onLoad={() => {
          console.log("Google Maps script loaded");
          setMapLoaded(true);
        }}
        onError={(e) => console.error("Error loading Google Maps:", e)}
      />
      
      <ClientOnly>
        {/* Debug info - will help with troubleshooting */}
        <div className="fixed top-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs z-50 pointer-events-none">
          Homes: {homes.length} | Markers: {markersRef.current.length} | Map Loaded: {mapLoaded ? "Yes" : "No"} | Map Initialized: {isMapInitialized ? "Yes" : "No"}
        </div>
        
        <div className="flex h-screen theme-bg-primary">
          {/* Sidebar - Using the shared component */}
          <Sidebar 
            darkMode={darkMode}
            signOut={signOut}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Main content */}
          <div className="flex-1 overflow-auto theme-bg-secondary">
            {/* Header */}
            <header className="standard-header">
              <div className="standard-header-content">
                <div className="flex items-center mb-4">
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="theme-text-primary hover:opacity-70 transition-opacity p-1"
                  >
                    {sidebarOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>

                  {/* Centered logo when sidebar is closed */}
                  {!sidebarOpen && (
                    <div className="header-logo-center">
                      <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                    </div>
                  )}

                  <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'}`}>
                    {sidebarOpen && (
                      <>
                        <h1 className="text-2xl font-semibold theme-text-primary">Canvassing Areas</h1>
                        <p className="theme-text-secondary">Manage your territories and track door-to-door progress</p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Add Pin Houses button */}
                <button 
                  className={`ml-auto flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                    isPinningMode 
                      ? (darkMode 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500 scale-105' 
                          : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 scale-105')
                      : 'theme-bg-tertiary theme-text-primary hover:opacity-80'
                  }`}
                  onClick={togglePinningMode}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isPinningMode ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isPinningMode ? 'Exit Pin Mode' : 'Pin Houses'}
                </button>
                
                {/* Add Draw Area button (Manager only) */}
                {isManager() && (
                  <button 
                    className={`ml-3 flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isDrawingMode 
                        ? (darkMode ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white')
                        : 'theme-bg-tertiary theme-text-primary hover:opacity-80'
                    }`}
                    onClick={toggleDrawingMode}
                  >
                    <PenTool className="h-5 w-5 mr-2" />
                    {isDrawingMode ? 'Exit Drawing' : 'Draw Area'}
                  </button>
                )}

                {/* Mobile Areas Toggle Button */}
                <button 
                  className="lg:hidden ml-3 flex items-center px-4 py-2 rounded-lg theme-bg-tertiary theme-text-primary hover:opacity-80 transition-colors"
                  onClick={() => setAreasSidebarOpen(!areasSidebarOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {areasSidebarOpen ? 'Hide' : 'Areas'}
                </button>
              </div>
            </header>

            {/* Mobile Backdrop Overlay */}
            {areasSidebarOpen && (
              <div 
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                onClick={() => setAreasSidebarOpen(false)}
              />
            )}

            {/* Map and Areas */}
            <div className="flex h-[calc(100%-81px)]">
              {/* Map */}
              <div className={`${!sidebarOpen && !areasSidebarOpen ? 'w-full' : 'flex-1'} relative map-container-transition`}>
                <div id="map" className={`w-full h-full ${isPinningMode ? 'cursor-crosshair' : 'cursor-grab'}`}></div>
                
                {/* Map loading indicator - updated condition */}
                {(!isMapInitialized && mapLoaded) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'} mx-auto mb-4`}></div>
                      <p>Loading map...</p>
                      <button 
                        onClick={initializeMap}
                        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm"
                      >
                        Retry Loading
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Pinning mode indicator */}
                {isPinningMode && (
                  <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 ${darkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-500 to-cyan-600'} text-white px-6 py-3 rounded-lg shadow-xl flex items-center animate-pulse z-10`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">PINNING MODE: Click anywhere on the map to add a house</span>
                  </div>
                )}
                
                {/* Drawing mode indicator */}
                {isDrawingMode && (
                  <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 ${darkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-500 to-cyan-600'} text-white px-6 py-3 rounded-lg shadow-xl flex items-center animate-pulse-slow`}>
                    <PenTool className="h-5 w-5 mr-2" />
                    Draw a polygon on the map to create a new area
                  </div>
                )}
                
                {/* Map type toggle */}
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden">
                  <button 
                    onClick={toggleMapType}
                    className={`px-3 py-2 flex items-center text-sm font-medium ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`}
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    {mapType === 'satellite' ? 'Show Street Map' : 'Show Satellite'}
                  </button>
                </div>
                
                {/* Zoom controls */}
                <div className="absolute bottom-20 right-4 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
                  <button 
                    onClick={handleZoomIn}
                    className={`px-3 py-2 flex items-center justify-center hover:bg-gray-100 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <div className="h-px bg-gray-200"></div>
                  <button 
                    onClick={handleZoomOut}
                    className={`px-3 py-2 flex items-center justify-center hover:bg-gray-100 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                </div>

                {/* Floating Pin Homes Button - Mobile Only */}
                <div className="lg:hidden absolute bottom-20 left-4">
                  <button 
                    className={`floating-button flex items-center px-4 py-3 rounded-full shadow-lg ${
                      isPinningMode 
                        ? (darkMode 
                            ? 'bg-amber-500 text-white shadow-amber-500/50 ring-2 ring-amber-500 scale-105' 
                            : 'bg-blue-500 text-white shadow-blue-500/50 ring-2 ring-blue-500 scale-105')
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-gray-500/30'
                    }`}
                    onClick={togglePinningMode}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isPinningMode ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="ml-2 text-sm font-medium">
                      {isPinningMode ? 'Exit' : 'Pin'}
                    </span>
                  </button>
                </div>

                {/* Floating Areas Toggle Button - Mobile Only (when sidebar is hidden) */}
                {!areasSidebarOpen && (
                  <div className="lg:hidden absolute top-20 right-4">
                    <button 
                      className="floating-button flex items-center px-4 py-3 rounded-full bg-white text-gray-700 hover:bg-gray-50 shadow-lg shadow-gray-500/30"
                      onClick={() => setAreasSidebarOpen(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="ml-2 text-sm font-medium">Areas</span>
                    </button>
                  </div>
                )}

                {/* Floating Areas Toggle Button - Desktop Only (when sidebar is hidden) */}
                {!areasSidebarOpen && (
                  <div className="hidden lg:block absolute top-20 right-4">
                    <button 
                      className="floating-button flex items-center px-4 py-3 rounded-full bg-white text-gray-700 hover:bg-gray-50 shadow-lg shadow-gray-500/30"
                      onClick={() => setAreasSidebarOpen(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="ml-2 text-sm font-medium">Show Areas</span>
                    </button>
                  </div>
                )}

                {/* Floating Main Sidebar Toggle Button - Mobile Only (when sidebar is hidden) */}
                {!sidebarOpen && (
                  <div className="lg:hidden absolute top-20 left-4">
                    <button 
                      className="floating-button flex items-center px-4 py-3 rounded-full bg-white text-gray-700 hover:bg-gray-50 shadow-lg shadow-gray-500/30"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className="ml-2 text-sm font-medium">Menu</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Areas sidebar */}
              <div 
                className={`${areasSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${areasSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'} fixed lg:relative top-0 right-0 h-full w-80 lg:w-80 theme-bg-tertiary p-4 overflow-y-auto shadow-xl border-l theme-border-primary z-40 sidebar-transition`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Desktop Close Button */}
                <div className="hidden lg:flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold theme-text-primary">Your Areas</h2>
                  <button 
                    onClick={() => setAreasSidebarOpen(false)}
                    className="p-2 rounded-lg theme-bg-quaternary theme-text-secondary hover:theme-text-primary transition-colors"
                    aria-label="Hide areas panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Close Button */}
                <div className="lg:hidden flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold theme-text-primary">Your Areas</h2>
                  <button 
                    onClick={() => setAreasSidebarOpen(false)}
                    className="p-2 rounded-lg theme-bg-quaternary theme-text-secondary hover:theme-text-primary transition-colors"
                    aria-label="Close areas panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Swipe Indicator */}
                <div className="lg:hidden flex justify-center mb-2">
                  <div className="w-12 h-1 bg-gray-400 rounded-full opacity-50"></div>
                </div>

                {/* Search and buttons */}
                <div className="flex items-center mb-6 gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search areas..."
                      className="p-3 pl-10 w-full theme-bg-quaternary border theme-border-primary rounded-xl theme-text-primary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm sm:text-base"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3.5 h-4 w-4 theme-text-secondary" />
                  </div>
                  <button className="p-3 rounded-xl theme-bg-quaternary theme-text-secondary hover:theme-text-primary border theme-border-primary hover:theme-border-secondary transition-all duration-200 hover:theme-bg-tertiary">
                    <Filter className="h-5 w-5" />
                  </button>
                  <button className={`p-3 rounded-xl ${darkMode ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white shadow-lg transition-all duration-200 transform hover:scale-105`}>
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {/* Areas list */}
                <h2 className="hidden lg:block text-lg font-semibold theme-text-primary mb-3 pl-1">Your Areas</h2>
                <div className="space-y-3">
                  {filteredAreas.length > 0 ? (
                    filteredAreas.map((area) => (
                      <div 
                        key={area.id} 
                        className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedArea?.id === area.id 
                            ? `theme-bg-quaternary border-l-4 ${darkMode ? 'border-amber-500' : 'border-blue-500'} shadow-lg` 
                            : 'theme-bg-tertiary hover:theme-bg-quaternary border-l-4 border-transparent'
                        }`}
                        onClick={() => setSelectedArea(area)}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3 ring-2 ring-white/20"
                            style={{ backgroundColor: area.color }}
                          ></div>
                          <h3 className="font-medium theme-text-primary text-sm sm:text-base">{area.name}</h3>
                        </div>
                        <p className="text-xs sm:text-sm theme-text-secondary mt-2 ml-7">{area.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 px-4 theme-bg-quaternary rounded-xl border theme-border-primary">
                      <svg className="w-12 h-12 theme-text-secondary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="theme-text-secondary">No areas match your search.</p>
                      <button className={`mt-3 ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-blue-400 hover:text-blue-300'} text-sm font-medium`}>Clear Search</button>
                    </div>
                  )}
                </div>

                {/* Selected area details */}
                {selectedArea && (
                  <div className="mt-6 p-5 theme-bg-quaternary rounded-xl shadow-lg border theme-border-primary">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-4 h-4 rounded-full mr-3 ring-2 ring-white/20"
                        style={{ backgroundColor: selectedArea.color }}
                      ></div>
                      <h3 className="text-lg font-semibold theme-text-primary">{selectedArea.name}</h3>
                    </div>
                    <p className="theme-text-secondary mb-5">{selectedArea.description}</p>
                    
                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="theme-bg-tertiary p-3 rounded-xl border theme-border-primary hover:theme-border-secondary transition-all duration-200 hover:theme-bg-quaternary">
                        <div className="text-xs theme-text-secondary uppercase tracking-wider">Houses</div>
                        <div className="text-xl theme-text-primary font-semibold mt-1">245</div>
                      </div>
                      <div className="theme-bg-tertiary p-3 rounded-xl border theme-border-primary hover:theme-border-secondary transition-all duration-200 hover:theme-bg-quaternary">
                        <div className="text-xs theme-text-secondary uppercase tracking-wider">Doors Knocked</div>
                        <div className="text-xl theme-text-primary font-semibold mt-1">127</div>
                      </div>
                      <div className="theme-bg-tertiary p-3 rounded-xl border theme-border-primary hover:theme-border-secondary transition-all duration-200 hover:theme-bg-quaternary">
                        <div className="text-xs theme-text-secondary uppercase tracking-wider">Appointments</div>
                        <div className="text-xl theme-text-primary font-semibold mt-1">14</div>
                      </div>
                      <div className="theme-bg-tertiary p-3 rounded-xl border theme-border-primary hover:theme-border-secondary transition-all duration-200 hover:theme-bg-quaternary">
                        <div className="text-xs theme-text-secondary uppercase tracking-wider">Conversion</div>
                        <div className="text-xl theme-text-primary font-semibold mt-1">11.0%</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className={`flex-1 py-3 px-4 ${darkMode ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white rounded-xl shadow-lg transition-all duration-200 font-medium`}>
                        Start Canvassing
                      </button>
                      <button className="py-3 px-4 theme-bg-tertiary theme-text-primary rounded-xl hover:theme-bg-quaternary transition-all duration-200 border theme-border-primary hover:theme-border-secondary">
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Home Status Modal */}
            {showHomeModal && selectedHome && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 animate-fadeIn">
                <div className="theme-bg-tertiary rounded-xl shadow-2xl w-full max-w-md p-6 border theme-border-primary transform transition-all duration-300 animate-scaleIn">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold theme-text-primary">{selectedHome.address}</h2>
                    <button
                      onClick={() => setShowHomeModal(false)}
                      className="theme-text-secondary hover:theme-text-primary"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="theme-text-primary mb-4">
                    Select the conversation outcome for this home:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => handleHomeStatusUpdate('not_home')}
                      className={`p-4 rounded-md border flex flex-col items-center justify-center ${selectedHome.status === 'not_home' 
                        ? (darkMode ? 'bg-amber-500 border-amber-600 text-white' : 'bg-blue-500 border-blue-600 text-white')
                        : 'theme-bg-quaternary theme-border-primary theme-text-primary hover:theme-bg-tertiary'} transition-colors duration-200`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Not Home</span>
                      {selectedHome.status === 'not_home' && (
                        <div className="mt-2 text-xs">✓ Selected</div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleHomeStatusUpdate('not_interested')}
                      className={`p-4 rounded-md border flex flex-col items-center justify-center ${selectedHome.status === 'not_interested' 
                        ? 'bg-red-500 border-red-600 text-white' 
                        : 'theme-bg-quaternary theme-border-primary theme-text-primary hover:theme-bg-tertiary'} transition-colors duration-200`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span className="font-medium">Not Interested</span>
                      {selectedHome.status === 'not_interested' && (
                        <div className="mt-2 text-xs">✓ Selected</div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleHomeStatusUpdate('appointment_set')}
                      className={`p-4 rounded-md border flex flex-col items-center justify-center ${selectedHome.status === 'appointment_set' 
                        ? (darkMode ? 'bg-amber-500 border-amber-600 text-white' : 'bg-blue-500 border-blue-600 text-white')
                        : 'theme-bg-quaternary theme-border-primary theme-text-primary hover:theme-bg-tertiary'} transition-colors duration-200`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Set Appointment</span>
                      {selectedHome.status === 'appointment_set' && (
                        <div className="mt-2 text-xs">✓ Selected</div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleHomeStatusUpdate('sold')}
                      className={`p-4 rounded-md border flex flex-col items-center justify-center ${selectedHome.status === 'sold' 
                        ? 'bg-green-500 border-green-600 text-white' 
                        : 'theme-bg-quaternary theme-border-primary theme-text-primary hover:theme-bg-tertiary'} transition-colors duration-200`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Sold</span>
                      {selectedHome.status === 'sold' && (
                        <div className="mt-2 text-xs">✓ Selected</div>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowHomeModal(false)}
                      className="px-4 py-2 theme-bg-quaternary theme-text-primary rounded theme-border-primary border hover:theme-bg-tertiary transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={() => {
                        handleDeleteHome(selectedHome.id);
                        setShowHomeModal(false);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                    >
                      Delete House
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* New Area Modal */}
            {showAreaNameModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 animate-fadeIn">
                <div className="theme-bg-tertiary rounded-xl shadow-2xl w-full max-w-md p-6 border theme-border-primary transform transition-all duration-300 animate-scaleIn">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold theme-text-primary">Name Your New Area</h3>
                    <button 
                      onClick={cancelAreaCreation} 
                      className="theme-text-secondary hover:theme-text-primary transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium theme-text-secondary">Area Name</label>
                      <input 
                        type="text"
                        className="w-full p-3 theme-bg-quaternary rounded-xl border theme-border-primary theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        placeholder="Enter a name for this area"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium theme-text-secondary">Description (Optional)</label>
                      <textarea
                        className="w-full p-3 theme-bg-quaternary rounded-xl border theme-border-primary theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[100px]"
                        placeholder="Describe this area..."
                        value={newAreaDescription}
                        onChange={(e) => setNewAreaDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={cancelAreaCreation}
                        className="flex-1 py-3 px-4 rounded-xl theme-bg-quaternary theme-text-primary border theme-border-primary hover:theme-bg-tertiary transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveNewArea}
                        disabled={!newAreaName}
                        className={`flex-1 py-3 px-4 rounded-xl text-white flex justify-center items-center ${
                          !newAreaName 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : darkMode 
                              ? 'bg-amber-500 hover:bg-amber-600' 
                              : 'bg-blue-500 hover:bg-blue-600'
                        } transition-all duration-200`}
                      >
                        <Save className="h-5 w-5 mr-2" />
                        Save Area
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add success notification toast */}
            {showPinSuccess && lastPinPosition && (
              <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center animate-fadeIn z-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  Pin successfully placed at position: 
                  <span className="font-mono ml-1">
                    {lastPinPosition.lat.toFixed(5)}, {lastPinPosition.lng.toFixed(5)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </ClientOnly>
    </>
  );
}