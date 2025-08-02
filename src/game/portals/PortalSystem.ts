/**
 * 🚪 Portal System
 *
 * Handles registration and activation of portals that bridge separate worlds.
 * The system delegates cross-realm messaging to `DivinaL3Client` so the
 * rendering and gameplay layers remain agnostic of the underlying network.
 */

import { Portal, PortalTransitionOptions } from "./PortalTypes";
import { DivinaL3Client } from "../network/DivinaL3Client";

/**
 * Analytics captured for each portal. `count` tracks popularity while
 * `totalLatency` lets us compute averages externally.
 */
export interface PortalStats {
  count: number;
  totalLatency: number; // milliseconds
}

export interface PortalSystemConfig {
  networkClient: DivinaL3Client; // injected to aid testing/mocking
  onTraversal?: (portalId: string, stats: PortalStats) => void; // analytics hook
  playEffect?: (effectName?: string) => void; // UI/UX hook
}

export class PortalSystem {
  private network: DivinaL3Client;
  private portals: Map<string, Portal> = new Map();
  private stats: Map<string, PortalStats> = new Map();
  private onTraversal?: (portalId: string, stats: PortalStats) => void;
  private playEffect?: (effectName?: string) => void;

  constructor(config: PortalSystemConfig) {
    this.network = config.networkClient;
    this.onTraversal = config.onTraversal;
    this.playEffect = config.playEffect;
  }

  /** Register a portal so the system can track it and expose analytics. */
  registerPortal(portal: Portal): void {
    this.portals.set(portal.id, portal);
    // initialize analytics entry
    this.stats.set(portal.id, { count: 0, totalLatency: 0 });
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

    const start = Date.now();
    const ok = await this.network.sendPortalHandshake(portalId);
    const latency = Date.now() - start;
    if (!ok) return false;

    // Update analytics
    const stat = this.stats.get(portalId);
    if (stat) {
      stat.count += 1;
      stat.totalLatency += latency;
      this.onTraversal?.(portalId, { ...stat });
    }

    // Fire UI hooks for effects
    this.playEffect?.(options.effect);

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

  /** Retrieve aggregated stats for a given portal. */
  getPortalStats(id: string): PortalStats | undefined {
    return this.stats.get(id);
  }
}
