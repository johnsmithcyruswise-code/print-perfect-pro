declare module "qz-tray" {
  interface QZConfig {
    printers?: string[];
  }
  const qz: {
    websocket: {
      isActive: () => boolean;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
    };
    printers: {
      find: () => Promise<string[]>;
    };
    configs: {
      create: (printer?: string | null, options?: { copies: number; size: { width: number; height: number }; units: string; colorType: string; scaleContent?: boolean }) => QZConfig;
    };
    print: (config: QZConfig, data: Array<{ type: string; format?: string; flavor?: string; data: string }>) => Promise<void>;
  };
  export default qz;
}
