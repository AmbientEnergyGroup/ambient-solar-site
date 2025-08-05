// Type definitions for Google Maps JavaScript API
// This is a simplified version to fix TypeScript errors in our app
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setOptions(options: MapOptions): void;
      getZoom(): number;
      setZoom(zoom: number): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      setMapTypeId(mapTypeId: string): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class Polygon {
      constructor(opts?: PolygonOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
    }

    interface MapsEventListener {
      remove(): void;
    }

    const event: {
      addListener(instance: any, eventName: string, handler: Function): MapsEventListener;
    };

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      styles?: any[];
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      zoomControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
      label?: string | MarkerLabel;
      animation?: Animation;
      clickable?: boolean;
      zIndex?: number;
    }

    interface PolygonOptions {
      paths?: Array<LatLng | LatLngLiteral> | Array<Array<LatLng | LatLngLiteral>>;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fillColor?: string;
      fillOpacity?: number;
      map?: Map;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
    }

    interface Icon {
      url: string;
      size?: Size;
      scaledSize?: Size;
      origin?: Point;
      anchor?: Point;
    }

    interface Symbol {
      path: SymbolPath | string;
      fillColor?: string;
      fillOpacity?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface Size {
      width: number;
      height: number;
    }

    interface Point {
      x: number;
      y: number;
    }

    enum SymbolPath {
      CIRCLE,
      FORWARD_CLOSED_ARROW,
      FORWARD_OPEN_ARROW,
      BACKWARD_CLOSED_ARROW,
      BACKWARD_OPEN_ARROW
    }

    enum Animation {
      BOUNCE,
      DROP
    }
  }
}

// Add Google Maps to Window interface
interface Window {
  google: typeof google;
} 