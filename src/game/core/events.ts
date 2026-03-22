import type { FightResult } from "./gameState";

export type CombatEvent =
  | { type: "damage"; attackerId: string; targetId: string; damage: number; spell: string }
  | { type: "death"; entityId: string }
  | { type: "turnStart"; entityId: string; turnNumber: number }
  | { type: "turnEnd"; entityId: string }
  | { type: "fightEnd"; result: FightResult };

export type CombatEventListener = (event: CombatEvent) => void;

export class CombatEventBus {
  private listeners: CombatEventListener[] = [];
  private log: CombatEvent[] = [];

  on(listener: CombatEventListener): void {
    this.listeners.push(listener);
  }

  off(listener: CombatEventListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  emit(event: CombatEvent): void {
    this.log.push(event);
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getLog(): CombatEvent[] {
    return this.log;
  }

  clear(): void {
    this.listeners = [];
    this.log = [];
  }
}
