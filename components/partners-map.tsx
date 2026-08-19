"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { networkPoints, networkColors, networkLabels } from "@/lib/network-data";

export function PartnersMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView([-1.5, 110], 5);
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 18,
        }
      ).addTo(map);

      const pinIcon = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div class="marker-pin" style="background:${color}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

      networkPoints.forEach((point) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: pinIcon(networkColors[point.type]),
        }).addTo(map);

        marker.bindPopup(
          `<strong style="color:#17301F">${point.name}</strong><br/><span style="color:${networkColors[point.type]}">${networkLabels[point.type]}</span>`
        );

        if (point.type === "mitra") {
          L.circle([point.lat, point.lng], {
            radius: 90000,
            color: networkColors.mitra,
            weight: 1,
            fillOpacity: 0.06,
            opacity: 0.35,
          }).addTo(map);
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] rounded-2xl overflow-hidden border border-forest/10 shadow-[0_20px_40px_-12px_rgba(23,48,31,0.18)]"
    />
  );
}
