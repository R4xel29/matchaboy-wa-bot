'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import { STORE, DELIVERY_CONFIG } from '@/lib/constants';
import { getDistanceFromStore, calculateDeliveryFee, isWithinDeliveryRange } from '@/lib/delivery-utils';
import { formatRupiah } from '@/lib/utils';

interface MapPickerProps {
  onLocationSelect: (data: {
    label: string;
    detail: string;
    lat: number;
    lng: number;
    distance: number;
    deliveryFee: number;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

// Dummy preset locations for demonstration
const PRESET_LOCATIONS = [
  { name: 'Sudirman, Jakarta Selatan', lat: -6.2088, lng: 106.8220, detail: 'Jl. Jend. Sudirman' },
  { name: 'Senayan, Jakarta Selatan', lat: -6.2273, lng: 106.8020, detail: 'Senayan Area' },
  { name: 'Kemang, Jakarta Selatan', lat: -6.2615, lng: 106.8132, detail: 'Jl. Kemang Raya' },
  { name: 'Menteng, Jakarta Pusat', lat: -6.1944, lng: 106.8425, detail: 'Jl. Menteng Raya' },
  { name: 'PIK, Jakarta Utara', lat: -6.1100, lng: 106.7400, detail: 'Pantai Indah Kapuk' },
  { name: 'Bekasi Barat', lat: -6.2349, lng: 106.9896, detail: 'Bekasi Barat Area' },
  { name: 'Tangerang Selatan', lat: -6.2838, lng: 106.7190, detail: 'BSD City' },
  { name: 'Depok, Margonda', lat: -6.3924, lng: 106.8227, detail: 'Jl. Margonda Raya' },
];

export function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<typeof PRESET_LOCATIONS[0] | null>(null);
  const [pinLat, setPinLat] = useState(initialLat ?? STORE.lat);
  const [pinLng, setPinLng] = useState(initialLng ?? STORE.lng);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setPinLat(newLat);
      setPinLng(newLng);
      // Automatically select custom location
      setSelectedLocation({
        name: 'Lokasi Custom (Pin)',
        detail: `Kordinat: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
        lat: newLat,
        lng: newLng
      });
      setSearchQuery('Lokasi Custom (Pin)');
    }
  }, []);

  const distance = getDistanceFromStore(pinLat, pinLng);
  const deliveryFee = calculateDeliveryFee(distance);
  const withinRange = isWithinDeliveryRange(distance);

  const filteredLocations = PRESET_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPreset = useCallback(
    (loc: typeof PRESET_LOCATIONS[0]) => {
      setSelectedLocation(loc);
      setPinLat(loc.lat);
      setPinLng(loc.lng);
      setSearchQuery(loc.name);
    },
    []
  );

  const handleConfirm = () => {
    if (!selectedLocation) return;
    onLocationSelect({
      label: selectedLocation.name,
      detail: selectedLocation.detail,
      lat: pinLat,
      lng: pinLng,
      distance,
      deliveryFee: withinRange ? deliveryFee : 0,
    });
  };

  const handleDetectLocation = () => {
    // Simulate geolocation — pick a random nearby point
    const randomOffset = () => (Math.random() - 0.5) * 0.08;
    const lat = STORE.lat + randomOffset();
    const lng = STORE.lng + randomOffset();
    const mockLoc = {
      name: 'Lokasi Saat Ini',
      lat,
      lng,
      detail: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    handleSelectPreset(mockLoc);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedLocation(null);
          }}
          placeholder="Cari alamat pengiriman..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border 
            bg-card text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-matcha-500/30 focus:border-matcha-500
            transition-all"
        />
      </div>

      {/* Detect Location Button */}
      <button
        onClick={handleDetectLocation}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl 
          border border-dashed border-matcha-400 bg-matcha-50/50
          text-matcha-700 text-sm font-medium
          hover:bg-matcha-50 transition-colors touch-target"
      >
        <Navigation className="w-4 h-4" />
        Gunakan lokasi saat ini
      </button>

      {/* Real Google Map Visual */}
      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-muted border border-border">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-matcha-50">
            <Loader2 className="w-8 h-8 animate-spin text-matcha-600" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat: pinLat, lng: pinLng }}
            zoom={14}
            onClick={onMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {/* Store marker */}
            <Marker
              position={{ lat: STORE.lat, lng: STORE.lng }}
              icon={{
                path: typeof window !== "undefined" ? window.google.maps.SymbolPath.CIRCLE : 0,
                scale: 8,
                fillColor: "#1B4332",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
              }}
            />

            {/* Delivery radius circle */}
            <Circle
              center={{ lat: STORE.lat, lng: STORE.lng }}
              radius={DELIVERY_CONFIG.maxDistanceKm * 1000}
              options={{
                fillColor: "#1B4332",
                fillOpacity: 0.05,
                strokeColor: "#1B4332",
                strokeOpacity: 0.3,
                strokeWeight: 2,
                clickable: false,
              }}
            />

            {/* User pin */}
            {selectedLocation && (
              <Marker
                position={{ lat: pinLat, lng: pinLng }}
                animation={typeof window !== "undefined" ? window.google.maps.Animation.DROP : undefined}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Preset Location Suggestions */}
      {!selectedLocation && searchQuery.length === 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            Alamat Populer
          </p>
          {PRESET_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleSelectPreset(loc)}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-xl
                bg-card border border-border/50 hover:border-matcha-300
                transition-colors text-left touch-target"
            >
              <MapPin className="w-4 h-4 text-matcha-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{loc.name}</p>
                <p className="text-xs text-muted-foreground">{loc.detail}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {!selectedLocation && searchQuery.length > 0 && (
        <div className="space-y-1.5">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleSelectPreset(loc)}
                className="w-full flex items-start gap-3 px-4 py-3 rounded-xl
                  bg-card border border-border/50 hover:border-matcha-300
                  transition-colors text-left touch-target"
              >
                <MapPin className="w-4 h-4 text-matcha-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.detail}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Selected Location Info */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Address card */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-matcha-50 border border-matcha-200">
            <MapPin className="w-4 h-4 text-matcha-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{selectedLocation.name}</p>
              <p className="text-xs text-muted-foreground">{selectedLocation.detail}</p>
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null);
                setSearchQuery('');
              }}
              className="text-xs text-matcha-600 font-medium hover:underline touch-target"
            >
              Ubah
            </button>
          </div>

          {/* Distance & Fee */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">Jarak</p>
              <p className="text-sm font-bold text-foreground">{distance.toFixed(1)} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ongkos Kirim</p>
              <p className="text-sm font-bold text-matcha-700">
                {withinRange ? formatRupiah(deliveryFee) : '-'}
              </p>
            </div>
          </div>

          {/* Out of range warning */}
          {!withinRange && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">
                Maaf, lokasi di luar jangkauan pengiriman kami (max {DELIVERY_CONFIG.maxDistanceKm} km).
              </p>
            </motion.div>
          )}

          {/* Confirm Button */}
          {withinRange && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-xl gradient-matcha text-white 
                font-semibold text-sm shadow-lg shadow-matcha-700/20
                flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Konfirmasi Alamat
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
