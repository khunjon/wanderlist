declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    getZoom(): number;
    fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: string;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
    styles?: MapTypeStyle[];
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers: MapTypeStyler[];
  }

  interface MapTypeStyler {
    [key: string]: string | number;
  }

  interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    setTitle(title: string): void;
    getTitle(): string;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
    label?: string | MarkerLabel;
    animation?: Animation;
    clickable?: boolean;
    draggable?: boolean;
    visible?: boolean;
    zIndex?: number;
  }

  interface MarkerLabel {
    text: string;
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
  }

  enum Animation {
    DROP,
    BOUNCE
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
    toString(): string;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(latLng: LatLng | LatLngLiteral): LatLngBounds;
    getCenter(): LatLng;
  }

  class InfoWindow {
    constructor(opts?: InfoWindowOptions);
    open(map?: Map | StreetViewPanorama, anchor?: MVCObject): void;
    close(): void;
    setContent(content: string | Node): void;
    getContent(): string | Node;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    getPosition(): LatLng;
  }

  interface InfoWindowOptions {
    content?: string | Node;
    position?: LatLng | LatLngLiteral;
    maxWidth?: number;
    pixelOffset?: Size;
  }

  class Size {
    constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    width: number;
    height: number;
    equals(other: Size): boolean;
    toString(): string;
  }

  class MVCObject {
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  class StreetViewPanorama extends MVCObject {
    constructor(container: Element, opts?: StreetViewPanoramaOptions);
  }

  interface StreetViewPanoramaOptions {
    position?: LatLng | LatLngLiteral;
    pov?: StreetViewPov;
    zoom?: number;
    visible?: boolean;
  }

  interface StreetViewPov {
    heading: number;
    pitch: number;
  }

  interface MapsEventListener {
    remove(): void;
  }

  class event {
    static addListener(instance: MVCObject, eventName: string, handler: Function): MapsEventListener;
    static removeListener(listener: MapsEventListener): void;
    static addListenerOnce(instance: MVCObject, eventName: string, handler: Function): MapsEventListener;
  }

  interface Icon {
    url: string;
    size?: Size;
    origin?: Point;
    anchor?: Point;
    scaledSize?: Size;
    labelOrigin?: Point;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
    equals(other: Point): boolean;
    toString(): string;
  }

  class Symbol {
    path: string;
    fillColor?: string;
    fillOpacity?: number;
    scale?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }
}

export {}; 