import { type PlayerState, createPlayerState } from "./playerState";

const SAVE_KEY = "tactical-rpg-save";

export interface SaveData {
  version: 1;
  playerState: PlayerState;
  completedDungeons: string[]; // dungeon IDs completed at least once
}

function createDefaultSave(): SaveData {
  return {
    version: 1,
    playerState: createPlayerState("bretteur"),
    completedDungeons: [],
  };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

/** Load existing save or create a fresh default */
export function loadOrCreateSave(): SaveData {
  return loadSave() ?? createDefaultSave();
}
