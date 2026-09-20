"use client";

import { useSyncExternalStore } from "react";
import { timeGreeting } from "@/utils/format";

const noopSubscribe = () => () => {};

export function Greeting() {
  // The server has no idea what time it is where the visitor actually is,
  // so fall back to a neutral placeholder for the server-rendered/first
  // client render, then read the browser-local greeting right after.
  const greeting = useSyncExternalStore(
    noopSubscribe,
    () => timeGreeting(),
    () => "Hey"
  );

  return <>{greeting}</>;
}
