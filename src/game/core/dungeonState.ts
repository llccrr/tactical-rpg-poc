export interface DungeonRunState {
  dungeonId: string;
  /** 0-indexed room number currently being fought */
  currentRoom: number;
  /** Player HP carried over between rooms. undefined = start at class max HP */
  playerHp: number | undefined;
}
