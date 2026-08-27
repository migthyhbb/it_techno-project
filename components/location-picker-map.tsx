"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LocationPickerProps {
  searchQuery?: string;
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    alamat: string;
    kelurahan: string;
    kecamatan: string;
    kota_kabupaten: string;
    provinsi: string;
  }) => void;
}

export function LocationPickerMap({ searchQuery, onLocationSelect }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if ((containerRef.current as any)._leaflet_id) {
      (containerRef.current as any)._leaflet_id = null;
    }

    let isMounted = true;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([-2.9761, 104.7754], 11);
      mapRef.current = map;

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        className: "",
        html: `<div style="background:#10B981; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const addr = data.address || {};

          onLocationSelect({
            lat,
            lng,
            alamat: data.display_name || "",
            kelurahan: addr.village || addr.suburb || addr.quarter || "",
            kecamatan: addr.town || addr.city_district || addr.district || "",
            kota_kabupaten: addr.city || addr.regency || addr.county || "",
            provinsi: addr.state || "",
          });
        } catch (err) {
          console.error("Gagal reverse geocoding:", err);
        }
      });
    })();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Auto-Fly & Simpan Lat/Lng Otomatis saat dropdown Wilayah dipilih
  useEffect(() => {
    if (!searchQuery || !mapRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const latitude = parseFloat(data[0].lat);
          const longitude = parseFloat(data[0].lon);

          mapRef.current?.flyTo([latitude, longitude], 13, { duration: 1.5 });

          // Update marker & lempar lat/lng ke form pendaftaran
          const L = (await import("leaflet")).default;
          const customIcon = L.divIcon({
            className: "",
            html: `<div style="background:#10B981; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.4);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else if (mapRef.current) {
            markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapRef.current);
          }

          onLocationSelect({
            lat: latitude,
            lng: longitude,
            alamat: "",
            kelurahan: "",
            kecamatan: "",
            kota_kabupaten: "",
            provinsi: "",
          });
        }
      } catch (err) {
        console.error("Gagal geocoding wilayah:", err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink/60">📌 Peta akan otomatis menyesuaikan wilayah. Klik titik spesifik di peta jika ingin lebih presisi:</p>
      <div ref={containerRef} className="w-full h-[280px] rounded-xl overflow-hidden border border-ink/20 z-0 relative" />
    </div>
  );
}