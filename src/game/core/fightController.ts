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

  /** Whether the player has enough PF for a given cost */
  canPlayerAffordPF(pfCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPF >= pfCost;
  }

  /** Whether the player has enough PS for a given cost */
  canPlayerAffordPS(psCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPS >= psCost;
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

  /** Deduct PF after an action. Returns false if not enough PF. */
  spendPF(cost: number): boolean {
    if (cost > this.state.remainingPF) return false;
    this.state.remainingPF -= cost;
    return true;
  }

  /** Deduct PS after an action. Returns false if not enough PS. */
  spendPS(cost: number): boolean {
    if (cost > this.state.remainingPS) return false;
    this.state.remainingPS -= cost;
    return true;
  }

  /**
   * Add Blood Points to the player, capped at psMax.
   * Returns the amount actually gained (0 if already at cap).
   * Emits a combat log entry when reason is provided.
   */
  addPS(amount: number, reason?: "inflict" | "take"): number {
    const before = this.state.remainingPS;
    const after = Math.min(this.state.character.psMax, before + amount);
    const gained = after - before;
    this.state.remainingPS = after;
    if (gained > 0 && reason) {
      const msg =
        reason === "inflict"
          ? `+${gained} PS (d\u00e9g\u00e2ts inflig\u00e9s)`
          : `+${gained} PS (d\u00e9g\u00e2ts subis)`;
      this.eventBus.emit({ type: "info", message: msg });
    }
    return gained;
  }

  /** End the player's turn, switch to enemy phase */
  endPlayerTurn(): void {
    this.eventBus.emit({ type: "turnEnd", entityId: PLAYER_ID });
    this.state.currentTurn = "enemy";
  }

  /** End the enemy phase and start a new player turn.
   *  Spec Edouard : PA, PF et PP cappent \u00e0 leur base chaque tour (pas de stack).
   *  PS ne r\u00e9g\u00e9n\u00e8re pas (cap psMax, ne monte que via d\u00e9g\u00e2ts inflig\u00e9s/subis). */
  endEnemyPhase(): void {
    this.state.currentTurn = "player";
    this.state.turnNumber += 1;
    this.state.remainingPM = this.state.character.moveRange;
    this.state.remainingPA = this.state.character.ap;
    this.state.remainingPF = this.state.character.pf;
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
