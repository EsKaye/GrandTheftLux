import { MissionChain } from "./MissionTypes";

export const LeylineDriftChain: MissionChain = {
  id: "leyline_drift",
  name: "Leyline Drift",
  missions: [
    {
      id: "ld_01",
      name: "Awakening",
      description: "Discover the ancient sigil hidden beneath Central Park.",
      objectives: [
        {
          id: "scan_sigil",
          description: "Scan the leyline anomaly.",
          completed: false,
        },
        {
          id: "collect_fragment",
          description: "Collect the fractured sigil piece.",
          completed: false,
        },
      ],
      rewards: ["sigil_fragment"],
    },
    {
      id: "ld_02",
      name: "Resonance",
      description: "Empower your vehicle with the recovered sigil.",
      objectives: [
        {
          id: "install_fragment",
          description: "Install the fragment into your ride.",
          completed: false,
        },
        {
          id: "drift_trial",
          description: "Complete a drift trial within the leyline.",
          completed: false,
        },
      ],
      rewards: ["vehicle_arcane_bike"],
    },
    {
      id: "ld_03",
      name: "Ascension",
      description: "Master the leyline energy and unlock divine speed.",
      objectives: [
        {
          id: "drift_challenge",
          description: "Win the midnight leyline race.",
          completed: false,
        },
      ],
      rewards: ["vehicle_astral_car"],
    },
  ],
  unlocks: ["vehicle_arcane_bike", "vehicle_astral_car"],
};
