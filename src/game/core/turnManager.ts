import type { GameState } from "./gameState";

/**
 * Manages turn resources (PM/PA) à la Dofus.
 * No rigid phases — the player can freely alternate between
 * moving and acting as long as they have points left.
 */
export class TurnManager {
  /** Deduct PM after a move. Returns false if not enough PM. */
  static spendPM(state: GameState, cost: number): boolean {
    if (cost > state.remainingPM) return false;
    state.remainingPM -= cost;
    return true;
  }

  /** Deduct PA after an action. Returns false if not enough PA. */
  static spendPA(state: GameState, cost: number): boolean {
    if (cost > state.remainingPA) return false;
    state.remainingPA -= cost;
    return true;
  }

  /** Whether the player still has PM to move */
  static canPlayerMove(state: GameState): boolean {
    return state.currentTurn === "player" && state.remainingPM > 0;
  }

  /** Whether the player has enough PA for a given cost */
  static canPlayerAfford(state: GameState, paCost: number): boolean {
    return state.currentTurn === "player" && state.remainingPA >= paCost;
  }

  /** Whether it's the player's turn */
  static isPlayerTurn(state: GameState): boolean {
    return state.currentTurn === "player";
  }

  /** End the player's turn and switch to enemy. */
  static endPlayerTurn(state: GameState): void {
    state.currentTurn = "enemy";
  }

  /** End the enemy's turn — reset player resources and start new round. */
  static endEnemyTurn(state: GameState): void {
    state.currentTurn = "player";
    state.turnNumber += 1;
    state.remainingPM = state.character.moveRange;
    state.remainingPA = state.character.ap;
  }
}
