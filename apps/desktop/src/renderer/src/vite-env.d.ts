/// <reference types="vite/client" />

interface Window {
  restaurantos: {
    printers: {
      list: () => Promise<
        Array<{
          description?: string;
          displayName?: string;
          isDefault?: boolean;
          name: string;
          status?: number;
        }>
      >;
      printReceipt: (input: { html: string; printerName?: string; silent?: boolean }) => Promise<{ success: boolean }>;
    };
    terminal: () => Promise<{ platform: string; version: string }>;
    window: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  };
}
