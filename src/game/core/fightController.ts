import type { GameState } from "./gameState";
import type { CombatEventBus } from "./events";

const PLAYER_ID = "player";

export class FightController {
  private eventBus: CombatEventBus;
  private state: GameState;

  constructor(state: GameState, eventBus: CombatEventBus) {
    this.state = state;
    this.eventBus = eventBus;
  }

  /** Whether it's the player's turn */
  isPlayerTurn(): boolean {
    return this.state.currentTurn === "player";
  }

  /** Whether the player still has PM to move */
  canPlayerMove(): boolean {
    return this.isPlayerTurn() && this.state.remainingPM > 0;
  }

  /** Whether the player has enough PA for a given cost */
  canPlayerAfford(paCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPA >= paCost;
  }

  /** Add PA (e.g. from combo reward or finisher kill) */
  addPA(amount: number): void {
    this.state.remainingPA += amount;
  }

  /** Get current remaining PA */
  getRemainingPA(): number {
    return this.state.remainingPA;
  }

  /** Deduct PM after a move. Returns false if not enough PM. */
  spendPM(cost: number): boolean {
    if (cost > this.state.remainingPM) return false;
    this.state.remainingPM -= cost;
    return true;
  }

  /** Deduct PA after an action. Returns false if not enough PA. */
  spendPA(cost: number): boolean {
    if (cost > this.state.remainingPA) return false;
    this.state.remainingPA -= cost;
    return true;
  }

  /** End the player's turn, switch to enemy phase */
  endPlayerTurn(): void {
    this.eventBus.emit({ type: "turnEnd", entityId: PLAYER_ID });
    this.state.currentTurn = "enemy";
  }

  /** End the enemy phase, reset player resources and start new round */
  endEnemyPhase(): void {
    this.state.currentTurn = "player";
    this.state.turnNumber += 1;
    this.state.remainingPM = this.state.character.moveRange;
    this.state.remainingPA = this.state.character.ap;
    this.eventBus.emit({
      type: "turnStart",
      entityId: PLAYER_ID,
      turnNumber: this.state.turnNumber,
    });
  }

  /** Get the ordered list of living enemy IDs for the current enemy phase */
  getLivingEnemyIds(): string[] {
    return this.state.enemies.map((e) => e.id);
  }

  /** Sync the combat log from event bus into game state (for React) */
  syncLog(): void {
    this.state.combatLog = this.eventBus.getLog();
  }
}
