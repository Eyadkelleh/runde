"use client";

import { useState } from "react";
import { findLocality, LOCALITIES, nearestLocality, type LocalityId } from "@/domain/catalog";
import { Button } from "@/components/ui/button";

export function CityField({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: LocalityId;
  onChange: (localityId: LocalityId) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const selectId = `${idPrefix}-stadt`;

  function suggest() {
    if (!("geolocation" in navigator)) {
      setStatus("Dieser Browser gibt keinen Standort her. Wähl die Stadt selbst.");
      return;
    }
    setStatus("Stadt wird vorgeschlagen …");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const localityId = nearestLocality(position.coords.latitude, position.coords.longitude);
        onChange(localityId);
        const label = findLocality(localityId)?.label ?? "Diese Stadt";
        setStatus(`Vorschlag: ${label}. Die Koordinaten werden nicht gespeichert.`);
      },
      () => setStatus("Standort nicht verwendet. Wähl die Stadt selbst."),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }

  return (
    <div>
      <label htmlFor={selectId} className="text-sm font-medium">
        Stadt
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value as LocalityId)}
        className="mt-2 h-11 w-full rounded-lg border border-input bg-card px-3 text-base"
      >
        {LOCALITIES.map((locality) => (
          <option key={locality.id} value={locality.id}>
            {locality.label}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={suggest}>
        Stadt vorschlagen
      </Button>
      <p id={`${selectId}-hint`} className="mt-2 text-sm leading-6 text-muted-foreground">
        Freiwillig. Sonst wählst du die Stadt von Hand. Eine genaue Position wird nicht gespeichert.
      </p>
      {status ? (
        <p role="status" className="mt-2 text-sm">
          {status}
        </p>
      ) : null}
    </div>
  );
}
