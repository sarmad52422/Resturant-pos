/// <reference types="vite/client" />

interface Window {
  restaurantos: {
    terminal: () => Promise<{ platform: string; version: string }>;
    window: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  };
}
