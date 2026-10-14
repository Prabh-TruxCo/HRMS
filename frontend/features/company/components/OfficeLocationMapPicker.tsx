"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type OfficeLocationMapPickerProps = Coordinates & {
  onChange: (coordinates: Coordinates) => void;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

const officeLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #2563eb;
      border: 3px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapController({ latitude, longitude }: Coordinates) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
    }
  }, [latitude, longitude, map]);

  return null;
}

function MapClickHandler({
  onChange,
}: {
  onChange: OfficeLocationMapPickerProps["onChange"];
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function DraggableOfficeMarker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: OfficeLocationMapPickerProps["onChange"];
}) {
  return (
    <Marker
      position={[latitude, longitude]}
      icon={officeLocationIcon}
      draggable
      eventHandlers={{
        dragend(event) {
          const marker = event.target as L.Marker;
          const position = marker.getLatLng();

          onChange({
            latitude: position.lat,
            longitude: position.lng,
          });
        },
      }}
    />
  );
}

export default function OfficeLocationMapPicker({
  latitude,
  longitude,
  onChange,
}: OfficeLocationMapPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasCoordinates = latitude !== null && longitude !== null;

  const center: [number, number] = hasCoordinates
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  const searchAddress = async () => {
    const searchQuery = query.trim();

    if (!searchQuery) {
      setSearchError("Please enter an address or place name.");
      setResults([]);
      return;
    }

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const parts = searchQuery
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      // Try the complete address, then progressively broader searches.
      const queries = [
        searchQuery,
        parts.length > 1 ? parts.slice(1).join(", ") : "",
        parts.length > 2 ? parts.slice(-4).join(", ") : "",
        "Punjab Agricultural University, Ludhiana, Punjab, India",
      ].filter(
        (value, index, array) =>
          value.length > 0 && array.indexOf(value) === index,
      );

      let matches: SearchResult[] = [];

      for (const searchTerm of queries) {
        const params = new URLSearchParams({
          q: searchTerm,
          format: "jsonv2",
          limit: "5",
          addressdetails: "1",
          countrycodes: "in",
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { headers: { Accept: "application/json" } },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 429
              ? "Too many searches. Please wait and try again."
              : `Address search failed (${response.status}).`,
          );
        }

        const data: SearchResult[] = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          matches = data;
          break;
        }
      }

      if (matches.length === 0) {
        setSearchError(
          "No matching places found. Search for a nearby road or landmark, then place the pin manually.",
        );
        return;
      }

      // Let the user choose the right result rather than
      // automatically selecting a potentially incorrect location.
      setResults(matches);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Unable to search for this address. Please try again.",
      );
    } finally {
      setSearching(false);
    }
  };

  function selectResult(result: SearchResult) {
    onChange({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    });

    setQuery(result.display_name);
    setResults([]);
    setSearchError(null);
  }

  function useCurrentLocation() {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Location detection is not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in your browser settings."
            : error.code === error.TIMEOUT
              ? "Location detection timed out. Please try again."
              : "Unable to detect your location. Check your device settings.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="office-location-search"
          className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
        >
          Find office on map
        </label>

        <div className="flex gap-2">
          <input
            id="office-location-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void searchAddress();
              }
            }}
            placeholder="Search office address or place"
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
          />

          <button
            type="button"
            onClick={() => void searchAddress()}
            disabled={searching}
            className="rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          {results.map((result, index) => (
            <button
              type="button"
              key={`${result.lat}-${result.lon}-${index}`}
              onClick={() => selectResult(result)}
              className="block w-full border-b border-[var(--border-muted)] px-3 py-3 text-left text-sm text-[var(--text-primary)] last:border-0 hover:bg-[var(--surface-muted)]"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      {searchError && (
        <p role="alert" className="text-sm text-red-600">
          {searchError}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <MapContainer
          center={center}
          zoom={hasCoordinates ? 16 : 5}
          scrollWheelZoom
          className="h-[320px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController latitude={latitude} longitude={longitude} />
          <MapClickHandler onChange={onChange} />

          {hasCoordinates && (
            <DraggableOfficeMarker
              latitude={latitude}
              longitude={longitude}
              onChange={onChange}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        Search for an address, click the map to place the pin, or drag the pin
        to fine-tune the office location.
      </p>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-60"
      >
        {locating ? "Detecting location..." : "Use My Current Location"}
      </button>

      {locationError && (
        <p role="alert" className="text-sm text-red-600">
          {locationError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-secondary)]">
            Latitude
          </label>
          <input
            readOnly
            value={latitude ?? ""}
            placeholder="Not selected"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--text-secondary)]">
            Longitude
          </label>
          <input
            readOnly
            value={longitude ?? ""}
            placeholder="Not selected"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
        </div>
      </div>
    </div>
  );
}
