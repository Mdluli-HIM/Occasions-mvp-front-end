"use client";

import { useEffect, useState } from "react";
import { fetchLocationCoverage } from "@/lib/api";
import { resolveArea, type LocationCoverage, type ProvinceId } from "@/lib/locations";

const INITIAL_LAUNCH: ProvinceId[] = ["limpopo"];

export function useLocationCoverage() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; coverage?: LocationCoverage; error?: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchLocationCoverage(controller.signal)
      .then((coverage) => { if (!controller.signal.aborted) setResult({ attempt, coverage }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ attempt, error: "Launch information is temporarily unavailable." }); });
    return () => controller.abort();
  }, [attempt]);

  const current = result?.attempt === attempt ? result : null;
  const coverage = current?.coverage ?? null;
  const error = current?.error ?? "";
  const launchProvinceIds = coverage?.launchProvinceIds ?? INITIAL_LAUNCH;
  function isAreaLaunched(value: string) {
    const area = resolveArea(value);
    return !!area && launchProvinceIds.includes(area.provinceId);
  }

  return { coverage, loading: !current, error, retry: () => setAttempt((value) => value + 1), unavailable: !!error, isAreaLaunched };
}
