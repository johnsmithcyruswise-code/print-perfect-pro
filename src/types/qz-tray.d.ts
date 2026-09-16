declare module "qz-tray" {
  interface QZConfig {
    printers?: string[];
  }
  const qz: {
    websocket: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
    };
    printers: {
      find: () => Promise<string[]>;
    };
    configs: {
      create: (printer?: string | null) => QZConfig;
    };
    print: (config: QZConfig, data: Array<{ type: string; format?: string; data: string }>) => Promise<void>;
  };
  export default qz;
}
