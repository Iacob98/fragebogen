"use client";

import { useState, useEffect } from "react";

export function useLocalStorage(key: string, initialValue: string): [string, (value: string) => void] {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(stored);
    } catch {}
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }, [key, value]);

  return [value, setValue];
}
