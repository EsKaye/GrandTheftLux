/**
 * 🌐 Divina‑L3 Network Client
 *
 * Production-minded wrapper around the GameDin Network. It establishes a
 * resilient WebSocket transport, keeping higher layers protocol-agnostic while
 * supporting retry/backoff for shaky connections.
 */

import WebSocket from "ws"; // lightweight cross-environment WebSocket

export interface DivinaL3Config {
  endpoint: string; // GameDin gateway URL
  apiKey?: string; // optional auth token for secured realms
  maxRetries?: number; // retry attempts before giving up
}

export class DivinaL3Client {
  private endpoint: string;
  private apiKey?: string;
  private maxRetries: number;
  private retries = 0;
  private ws?: WebSocket;
  private connected = false;

  constructor(config: DivinaL3Config) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries ?? 5;
  }

  /**
   * Establish a persistent WebSocket connection with exponential backoff. The
   * promise resolves once an open socket is available or rejects after the
   * maximum retries are exhausted.
   */
  async connect(): Promise<void> {
    const attempt = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(this.endpoint, {
          headers: this.apiKey ? { "x-api-key": this.apiKey } : undefined,
        });

        const cleanup = () => {
          ws.removeAllListeners("open");
          ws.removeAllListeners("error");
        };

        ws.on("open", () => {
          cleanup();
          this.ws = ws;
          this.connected = true;
          this.retries = 0;
          console.log(`🔌 Connected to GameDin at ${this.endpoint}`);
          resolve();
        });

        ws.on("error", (err) => {
          cleanup();
          if (this.retries < this.maxRetries) {
            const backoff = Math.pow(2, this.retries) * 1000;
            console.warn(
              `GameDin connection failed (${err.message}); retrying in ${backoff}ms`
            );
            this.retries++;
            setTimeout(() => attempt().then(resolve).catch(reject), backoff);
          } else {
            reject(err);
          }
        });
      });
    };

    await attempt();
  }

  /** Disconnect from GameDin network and reset state. */
  disconnect(): void {
    if (!this.connected) return;
    this.ws?.close();
    this.connected = false;
    console.log("🔌 Disconnected from GameDin");
  }

  /**
   * Notify GameDin that a portal transition is occurring. Resolves `true` when
   * an acknowledgement is received before timeout.
   */
  async sendPortalHandshake(portalId: string): Promise<boolean> {
    if (!this.connected || !this.ws) {
      console.warn("DivinaL3Client.sendPortalHandshake called before connect");
      return false;
    }

    console.log(`📡 Handshaking portal ${portalId} with GameDin`);

    return new Promise((resolve) => {
      const payload = JSON.stringify({ action: "portal_handshake", portalId });

      const timeout = setTimeout(() => {
        this.ws?.off("message", onMessage);
        console.warn(`Portal handshake for ${portalId} timed out`);
        resolve(false);
      }, 5000);

      const onMessage = (data: WebSocket.RawData) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.action === "portal_ack" && msg.portalId === portalId) {
            clearTimeout(timeout);
            this.ws?.off("message", onMessage);
            resolve(true);
          }
        } catch (err) {
          console.error("Failed to parse GameDin message", err);
        }
      };

      this.ws.on("message", onMessage);
      this.ws.send(payload);
    });
  }
}

