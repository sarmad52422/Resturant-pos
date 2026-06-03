/// <reference types="vite/client" />

interface Window {
  restaurantos: {
    cashDrawer: {
      kick: (input: { devicePath?: string; host?: string; port?: number }) => Promise<{ success: boolean }>;
    };
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
      printEscPos: (input: {
        devicePath?: string;
        host?: string;
        openDrawer?: boolean;
        port?: number;
        text: string;
      }) => Promise<{ success: boolean }>;
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
