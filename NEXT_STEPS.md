# Roadmap — Dungeon Crawler Wakfu/Dofus-like

## Phases

| Phase | Nom | Objectif | Statut |
|-------|-----|----------|--------|
| 0 | Combat de base | Boucle de combat fonctionnelle | ✅ Done |
| 1 | Classes | Sélection de classe, 2 classes jouables | ✅ Done |
| 2 | Donjon & Loot | Salles enchaînées, ressources droppées | ✅ Done |
| 3 | Craft & Équipement | Items craftables qui boostent les stats | ✅ Done |
| 4 | Progression & Contenu | Tiers de difficulté, boss, IA variée | ✅ Done |
| 5 | Co-op Duo | 2 joueurs local puis réseau | ⏳ À venir |
| 6 | Polish & Meta | Sauvegarde, hub visuel, sons, équilibrage | ⏳ À venir |

---

## Phase 2 — Donjon & Loot ✅

### Livré
- Structure de donjon (N salles + boss)
- 3 donjons : Caverne des Gobelins (T1), Crypte des Squelettes (T1), Marais du Slime (T2)
- 9 types d'ennemis définis dans `src/game/data/enemies.ts`
- 9 ressources lootables définies dans `src/game/data/resources.ts`
- HP persistants entre les salles d'un donjon
- Écran Hub (sélection de donjon + inventaire ressources)
- Écran DungeonEnd (récap victoire/défaite + ressource droppée)
- Routing App.tsx : create → hub → fight (multi-salles) → dungeon-end

---

## Phase 3 — Craft & Équipement

### Objectif
Permettre au joueur de crafter du stuff à partir des ressources accumulées, et que ce stuff améliore ses stats en combat.

### À implémenter
1. **Définitions d'items** (`src/game/data/items.ts`) : nom, slot (arme/armure/accessoire), bonus stats, recette (3 ressources)
2. **Inventaire d'équipement** : le joueur équipe 1 item par slot
3. **Écran de craft** (`src/screens/Crafting.tsx`) : liste items craftables, ressources requises vs possédées
4. **Application des stats** : bonus d'équipement ajoutés aux stats de base au démarrage du combat
5. **Progression** : items Tier 1 (ressources faciles) → Tier 2 (ressources donjons difficiles)

### Fichiers
- `src/game/data/items.ts` — nouveau
- `src/game/core/playerState.ts` — ajouter `equipment`
- `src/screens/Crafting.tsx` — nouveau
- `src/game/core/fightController.ts` — appliquer les bonus d'équipement

---

## Phase 4 — Progression & Contenu ✅

### Livré
- **IA par comportement** : 4 archétypes (melee, ranged, tank, boss) dans `src/game/core/ai.ts`
  - Melee : fonce sur le joueur
  - Ranged : garde ses distances, kite (attaque puis fuit avec les PM restants)
  - Tank : se positionne entre le joueur et les alliés fragiles
  - Boss : choisit le sort le plus dévastateur, se repositionne à distance idéale
- **Boss enrichis** : sorts multiples (2-3 sorts), sélection intelligente du meilleur sort
- **Donjon Tier 3 — Forteresse Démoniaque** (4 salles) dans `src/game/data/dungeons.ts`
  - 4 nouveaux ennemis : Démon (melee), Démon Sorcier (ranged), Démon Garde (tank), Archidémon (boss)
  - 3 nouvelles ressources : Corne de Démon, Flamme infernale, Coeur de Démon
  - 3 nouveaux items T3 : Lame Démoniaque (+10 ATK), Cuirasse Infernale (+6 DEF +10 PV), Pendentif du Démon (+4 ATK +3 DEF +8 PV)
- **13 ennemis** au total (contre 9 avant), tous avec un behavior assigné

---

## Phase 5 — Co-op Duo

### Objectif
2 joueurs (local d'abord, réseau optionnel).

### À implémenter
1. Mode Solo / Duo à l'accueil
2. Duo local : 2 personnages, tours alternés J1 → J2 → Ennemis
3. `GameState.characters[]` à la place d'un seul `character`
4. `FightController` multi-joueurs
5. HUD avec 2 barres de stats

---

## Phase 6 — Polish & Meta

1. **Sauvegarde** `localStorage` (inventaire, équipement, classe)
2. **Hub visuel** : carte des donjons accessibles/verrouillés/complétés
3. **Sons & musique** : effets de combat, ambiance par donjon
4. **Animations** : attaque/sort sur les personnages
5. **Équilibrage** : stats, coûts de craft, drop rates
