/**
 * 🌌 Portal Types
 *
 * Defines the core data structures for world-to-world travel. Keeping these
 * types isolated lets the `PortalSystem` focus on orchestration logic while
 * other systems (rendering, physics) can consume the same contracts without
 * tight coupling.
 */

import { Vector3D } from "../engine/math/VectorMath";

/**
 * Describes a single portal entry. A portal connects a source world to a
 * destination world and occupies a fixed position in 3D space.
 */
export interface Portal {
  id: string; // unique identifier for tracking and analytics
  sourceWorld: string; // e.g. "NYC" or "AstralRealm"
  destinationWorld: string; // target world/environment identifier
  position: Vector3D; // location of the portal in the source world
}

/**
 * Transition options allow designers to tweak how seamless the hand‑off feels.
 * These flags intentionally avoid hard tech assumptions so the UX team can
 * prototype without engine changes.
 */
export interface PortalTransitionOptions {
  seamless: boolean; // true => no loading screen, just fade effects
  effect?: string; // optional named VFX for the transition
  timeoutMs?: number; // safety valve to abort if network handshake stalls
}
