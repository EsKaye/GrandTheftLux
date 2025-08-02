/**
 * 🚪 Portal System
 *
 * Handles registration and activation of portals that bridge separate worlds.
 * The system delegates cross-realm messaging to `DivinaL3Client` so the
 * rendering and gameplay layers remain agnostic of the underlying network.
 */

import { Portal, PortalTransitionOptions } from "./PortalTypes";
import { DivinaL3Client } from "../network/DivinaL3Client";

export interface PortalSystemConfig {
  networkClient: DivinaL3Client; // injected to aid testing/mocking
}

export class PortalSystem {
  private network: DivinaL3Client;
  private portals: Map<string, Portal> = new Map();

  constructor(config: PortalSystemConfig) {
    this.network = config.networkClient;
  }

  /** Register a portal so the system can track it and expose analytics. */
  registerPortal(portal: Portal): void {
    this.portals.set(portal.id, portal);
  }

  /**
   * Perform a portal traversal. Returns `true` if the network handshake
   * succeeds and the UX layer may transition to the destination world.
   */
  async traverse(portalId: string, options: PortalTransitionOptions): Promise<boolean> {
    const portal = this.portals.get(portalId);
    if (!portal) {
      console.warn(`Unknown portal ${portalId}`);
      return false;
    }

    const ok = await this.network.sendPortalHandshake(portalId);
    if (!ok) return false;

    // At this point the network approved the transfer; let the caller handle
    // visuals. We only log to keep this module pure.
    console.log(
      `✨ Transitioning from ${portal.sourceWorld} to ${portal.destinationWorld}`
    );
    if (options.seamless) {
      console.log("🔄 Seamless mode enabled – skipping loading screen");
    }
    return true;
  }

  /** Convenience accessor mainly for debugging tools. */
  getPortal(id: string): Portal | undefined {
    return this.portals.get(id);
  }
}
