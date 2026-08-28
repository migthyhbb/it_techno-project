"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface MapPoint {
  id: string;
  name: string;
  type: "industri" | "mitra" | "pengolahan";
  lat: number;
  lng: number;
}

interface PartnerMapRecord {
  user_id?: string;
  nama_mitra?: string;
  nama_perusahaan?: string;
  lat?: number | string | null;
  lng?: number | string | null;
}

const networkColors = {
  industri: "#8B5A2B",
  mitra: "#10B981",
  pengolahan: "#F59E0B"
};

const networkLabels = {
  industri: "Industri Sumber",
  mitra: "Mitra & Agen",
  pengolahan: "Fasilitas Pengolahan"
};

const fixedPengolahanPoints: MapPoint[] = [
  {
    id: "pengolahan-jkt",
    name: "Fasilitas Pengolahan LENTERA Jakarta",
    type: "pengolahan",
    lat: -6.2088,
    lng: 106.8456,
  },
  {
    id: "pengolahan-plm",
    name: "Fasilitas Pengolahan LENTERA Palembang",
    type: "pengolahan",
    lat: -2.9761,
    lng: 104.7754,
  },
];

export function PartnersMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const leafletContainer = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (leafletContainer._leaflet_id) {
      leafletContainer._leaflet_id = undefined;
    }

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      const supabase = createSupabaseBrowserClient();

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([-2.5, 118], 5);
      mapRef.current = map;

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19 }
      ).addTo(map);

      const pinIcon = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div style="background:${color}; width:18px; height:18px; border-radius:50%; border:2.5px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

      const points: MapPoint[] = [...fixedPengolahanPoints];

      try {
        // Fetch Mitra (Pakai user_id)
        const { data: mitraData } = await supabase
          .from("mitra_profiles")
          .select("user_id, nama_mitra, lat, lng");



        if (mitraData && Array.isArray(mitraData)) {
          mitraData.forEach((m: PartnerMapRecord) => {
            const lat = parseFloat(String(m.lat));
            const lng = parseFloat(String(m.lng));
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              points.push({
                id: String(m.user_id),
                name: m.nama_mitra || "Mitra Agen",
                type: "mitra",
                lat,
                lng,
              });
            }
          });
        }

        // Fetch Industri (Pakai user_id)
        const { data: industriData } = await supabase
          .from("industri_profiles")
          .select("user_id, nama_perusahaan, lat, lng");



        if (industriData && Array.isArray(industriData)) {
          industriData.forEach((ind: PartnerMapRecord) => {
            const lat = parseFloat(String(ind.lat));
            const lng = parseFloat(String(ind.lng));
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              points.push({
                id: String(ind.user_id),
                name: ind.nama_perusahaan || "Industri",
                type: "industri",
                lat,
                lng,
              });
            }
          });
        }
      } catch (e) {
        console.error("Error fetching map points:", e);
      }

      if (cancelled) return;

      const bounds: [number, number][] = [];

      points.forEach((point) => {
        bounds.push([point.lat, point.lng]);

        const marker = L.marker([point.lat, point.lng], {
          icon: pinIcon(networkColors[point.type]),
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:sans-serif; padding:2px;">
            <strong style="color:#17301F; font-size:14px">${point.name}</strong><br/>
            <span style="color:${networkColors[point.type]}; font-size:12px; font-weight:600">${networkLabels[point.type]}</span>
          </div>`
        );

        if (point.type === "mitra") {
          L.circle([point.lat, point.lng], {
            radius: 12000,
            color: networkColors.mitra,
            weight: 1.5,
            fillOpacity: 0.12,
            opacity: 0.6,
          }).addTo(map);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] rounded-2xl overflow-hidden border border-forest/10 shadow-[0_20px_40px_-12px_rgba(23,48,31,0.18)] z-0 relative"
    />
  );
}