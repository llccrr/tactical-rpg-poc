# Next Steps — Tactical RPG POC

## 1. Portée de sort
- Ajouter un `spellRange` dans `CharacterState`
- Créer un second flood-fill avec couleur distincte (rouge/bleu) pour la zone de ciblage
- Introduire un mode "ciblage" séparé du mode "déplacement" (enum `ActionMode`)
- Afficher un panneau de sorts dans le UI React

## 2. Ennemi
- Créer un `EnemyState` dans `gameState.ts` (position, HP, stats)
- Réutiliser la classe `Character` avec une couleur différente
- Ajouter la position de l'ennemi au `blockedSet` pour empêcher le chevauchement
- Afficher les infos ennemi au survol dans le DebugPanel

## 3. Tour par tour
- Introduire un `TurnManager` dans `core/` qui gère les phases :
  - `move` → `action` → `end turn`
- State `currentTurn: 'player' | 'enemy'`
- Bloquer les inputs pendant le tour ennemi
- Ajouter un bouton "End Turn" dans le UI React
- Timeline visuelle des tours

## 4. IA basique
- L'ennemi utilise le même BFS pour se rapprocher du joueur
- Attaque si à portée de sort
- Comportement simple : approche → attaque → fin de tour
- Extensible vers des profils d'IA (agressif, défensif, etc.)

## 5. Intégration Tiled
- Remplacer les `Graphics` par un tilemap JSON exporté depuis Tiled
- Charger via `this.load.tilemapTiledJSON()`
- Adapter `iso.ts` pour lire les dimensions depuis le tilemap
- Utiliser les layers Tiled pour séparer sol / obstacles / décor
- Possibilité de maps multiples

## 6. Stats et combat
- Ajouter HP, attaque, défense dans `CharacterState`
- Créer un `combat.ts` pur (logique de résolution de dommages)
- Formule de dégâts : `max(1, attaque - défense) + random variance`
- Barres de vie affichées au-dessus des personnages
- Animation de dégâts (flash, nombre qui pop)

## 7. Améliorations visuelles
- Sprites animés (idle, walk, attack) en remplacement des diamonds
- Particules pour les sorts et les dégâts
- Caméra : zoom + pan sur le board
- Indicateurs de direction pendant le déplacement
- Feedback sonore minimal
