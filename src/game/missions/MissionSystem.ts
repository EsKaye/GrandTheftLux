import { MissionChain } from "./MissionTypes";

export interface MissionSystemConfig {
  chains: MissionChain[];
}

export class MissionSystem {
  private chains: Map<string, MissionChain> = new Map();
  private completedMissions: Set<string> = new Set();

  constructor(config: MissionSystemConfig) {
    config.chains.forEach((chain) => this.chains.set(chain.id, chain));
  }

  getChain(id: string): MissionChain | undefined {
    return this.chains.get(id);
  }

  completeMission(chainId: string, missionId: string): void {
    const chain = this.chains.get(chainId);
    const mission = chain?.missions.find((m) => m.id === missionId);
    if (!mission) return;
    mission.objectives.forEach((obj) => (obj.completed = true));
    this.completedMissions.add(missionId);
  }

  isMissionCompleted(missionId: string): boolean {
    return this.completedMissions.has(missionId);
  }
}
