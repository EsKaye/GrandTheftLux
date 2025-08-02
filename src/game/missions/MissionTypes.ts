export interface Objective {
  id: string;
  description: string;
  completed: boolean;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  objectives: Objective[];
  rewards?: string[];
}

export interface MissionChain {
  id: string;
  name: string;
  missions: Mission[];
  unlocks?: string[];
}
