"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface Location {
  id: string;
  slug: string;
  name: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface WorldMapProps {
  locations: Location[];
}

// Leaflet doesn't work with SSR, so we need to dynamically import it
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

function MapContent({ locations }: WorldMapProps) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    // Import leaflet on client side only
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  const mappableLocations = locations.filter((loc) => loc.coordinates);

  if (!L) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  // Custom marker icon
  const markerIcon = L.divIcon({
    className: "custom-marker",
    html: `<div class="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  // Limit vertical panning (latitude) but allow horizontal wrapping
  const maxBounds = L.latLngBounds(
    L.latLng(-85, -Infinity),
    L.latLng(85, Infinity)
  );

  return (
    <MapContainer
      center={[35, 20]}
      zoom={3}
      minZoom={2}
      maxZoom={10}
      className="h-full w-full"
      zoomControl={false}
      scrollWheelZoom={true}
      touchZoom="center"
      worldCopyJump={true}
      zoomSnap={0}
      wheelDebounceTime={20}
      wheelPxPerZoomLevel={12}
      bounceAtZoomLimits={false}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
    >
      {/* Zoom controls in bottom right */}
      <ZoomControl position="bottomright" />

      {/* CartoDB Positron - clean light colors */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />

      {mappableLocations.map((location) => (
        <Marker
          key={location.id}
          position={[location.coordinates!.lat, location.coordinates!.lng]}
          icon={markerIcon}
          eventHandlers={{
            click: () => {
              window.location.href = `/l/${location.slug}`;
            },
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -8]}
            permanent={false}
            className="location-tooltip"
          >
            <span className="font-medium">{location.name}</span>
            {location.country && (
              <span className="text-muted-foreground ml-1">
                ({location.country})
              </span>
            )}
          </Tooltip>
          <Popup>
            <a
              href={`/l/${location.slug}`}
              className="text-primary hover:underline font-medium"
            >
              {location.name}
            </a>
            {location.country && (
              <p className="text-sm text-muted-foreground">{location.country}</p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function WorldMap({ locations }: WorldMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ zIndex: 0, position: 'relative' }}>
      <MapContent locations={locations} />
    </div>
  );
}
