# Roadmap — Dungeon Crawler Wakfu/Dofus-like

## Phases

| Phase | Nom | Objectif | Statut |
|-------|-----|----------|--------|
| 0 | Combat de base | Boucle de combat fonctionnelle | ✅ Done |
| 1 | Classes | Sélection de classe, 2 classes jouables | ✅ Done |
| 2 | Donjon & Loot | Salles enchaînées, ressources droppées | 🚧 En cours |
| 3 | Craft & Équipement | Items craftables qui boostent les stats | ⏳ À venir |
| 4 | Progression & Contenu | Tiers de difficulté, boss, nouvelles classes | ⏳ À venir |
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

## Phase 4 — Progression & Contenu

### Objectif
Élargir le contenu pour créer une vraie boucle long terme.

### À implémenter
1. **Tiers de difficulté** : Tier 1 (débutant) → Tier 3 (difficile), donjons verrouillés selon stuff
2. **Ennemis variés** : comportements distincts (mêlée, ranged, tankeur)
3. **Boss de donjon** : IA enrichie, sorts spéciaux
4. **2 nouvelles classes** (ex: Mage, Paladin) dans `src/game/data/classes.ts`
5. **Regen partielle** entre certaines salles

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
