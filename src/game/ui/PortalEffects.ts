/**
 * ✨ Portal Effects
 *
 * Lightweight utility for triggering customizable visual/audio effects when a
 * portal activates. In a full engine this would orchestrate shader-based
 * visuals and WebAudio cues; here we log and call optional handlers so the
 * system stays decoupled from rendering details.
 */

export interface PortalEffectOptions {
  visual?: string; // identifier for VFX preset
  audio?: string; // identifier for SFX preset
}

export type EffectHandler = (opts: PortalEffectOptions) => void;

export class PortalEffects {
  constructor(private handler?: EffectHandler) {}

  /**
   * Trigger a named effect. Unknown effects are ignored to keep gameplay
   * flowing without hard failures.
   */
  trigger(name?: string): void {
    if (!name) return;
    const opts: PortalEffectOptions = { visual: name, audio: name };
    console.log(`🎇 Triggering portal effect: ${name}`);
    this.handler?.(opts);
  }
}

