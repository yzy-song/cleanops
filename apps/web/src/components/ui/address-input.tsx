"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PlaceData {
  address: string;
  lat: number;
  lng: number;
  eircode?: string;
}

interface AddressInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceSelect?: (place: PlaceData) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
}

let placesScriptPromise: Promise<void> | null = null;

function loadPlacesScript(): Promise<void> {
  if (placesScriptPromise) return placesScriptPromise;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    placesScriptPromise = Promise.resolve();
    return placesScriptPromise;
  }
  placesScriptPromise = new Promise((resolve) => {
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return placesScriptPromise;
}

const eircodeComponent = "postal_code";

export function AddressInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter address...",
  id,
  required,
  className,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPlacesScript().then(() => {
      if ((window as any).google?.maps?.places) {
        setReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current) return;
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "ie" },
      fields: ["address_components", "formatted_address", "geometry"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const address = place.formatted_address || "";
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      let eircode: string | undefined;
      if (place.address_components) {
        for (const comp of place.address_components) {
          if (comp.types.includes(eircodeComponent)) {
            eircode = comp.long_name;
            break;
          }
        }
      }

      onPlaceSelect?.({ address, lat, lng, eircode });

      if (onChange) {
        const synthetic = {
          target: { name: "address", value: address },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    });
    autocompleteRef.current = autocomplete;

    return () => {
      // cleanup handled by Maps
    };
  }, [ready]);

  return (
    <Input
      ref={inputRef}
      id={id}
      name="address"
      placeholder={placeholder}
      defaultValue={value}
      onChange={onChange}
      required={required}
      className={cn(className)}
    />
  );
}
