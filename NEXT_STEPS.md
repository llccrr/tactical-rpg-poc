# Roadmap — Dungeon Crawler Wakfu/Dofus-like

## Vision

Un jeu tactique solo de 1h-2h, plaisant à jouer, avec une équipe de 2 personnages.
Le joueur choisit 2 classes parmi 3, explore 5 donjons avec une difficulté croissante,
craft son équipement, et affronte un boss final avec une mécanique unique.

---

## Phases complétées

| Phase | Nom | Statut |
|-------|-----|--------|
| 0 | Combat de base | ✅ Done |
| 1 | Classes | ✅ Done |
| 2 | Donjon & Loot | ✅ Done |
| 3 | Craft & Équipement | ✅ Done |
| 4 | Progression & Contenu | ✅ Done |

---

## Diagnostic : où en est le jeu

### Ce qui marche bien
- Le système IopLike est riche (concentration / blood / courroux / combos)
- La boucle combat → loot → craft → donjon suivant fonctionne
- L'UI est propre et lisible (HUD, craft, hub)
- L'IA a 4 comportements distincts (melee, ranged, tank, boss)
- 4 donjons, 15 ennemis, 9 items craftables

### Ce qui pose problème
- **Bretteur et Sentinelle sont creux** : 3 sorts simples, aucune décision tactique
- **Toutes les salles sont identiques** : même grille 10×10, mêmes 9 obstacles, mêmes positions
- **Le grind** : 1 ressource par donjon = 2-3 runs identiques avant de crafter
- **Pas de narration** : aucune raison de continuer, pas de fil conducteur
- **1 seul personnage** : la profondeur tactique est limitée (pas de positionnement d'équipe)
- **Le joueur devient trop fort** : avec le stuff T3, les ennemis meurent en 1-2 coups
- **Pas d'audio** : le jeu est totalement silencieux
- **Pas de boss final** : la Forteresse Démoniaque finit sans climax

---

## Parcours émotionnel du joueur (1h-2h)

| Minutes | Phase | Sensation |
|---------|-------|-----------|
| 0-5 | Création d'équipe (2 persos) | Curiosité, choix stratégique |
| 5-20 | Donjons T1 (Gobelins, Squelettes) | Apprentissage, découverte des synergies entre persos |
| 20-40 | Donjons T2 (Slime) | Maîtrise, combats tactiques, craft satisfaisant |
| 40-70 | Donjon T3 (Démons) | Escalation, tension, les habitudes sont punies |
| 70-90 | Boss final (Trône de l'Archidémon) | Climax, tout ce qu'on a appris est testé |

---

## Phase 5 — Équipe de 2 personnages (PRIORITÉ 1 — Impact majeur)

### Objectif
Passer de 1 personnage contrôlé à une équipe de 2 personnages, avec des tours entrelacés.

### Design

**Sélection :** À la création, le joueur choisit 2 classes parmi 3 (pas de recrutement en jeu — trop de scope pour 1-2h).

**Ordre des tours (entrelacé, pas "tous joueurs puis tous ennemis") :**
```
Perso A → Ennemis → Perso B → Ennemis → nouveau round
```
Cet entrelacement force la planification tactique : "Je positionne A pour absorber les coups, puis B peut attaquer en sécurité après la phase ennemie."

**Équipement :** Partagé entre les 2 persos (les bonus de craft s'appliquent aux deux). Évite de doubler la complexité du craft.

**Synergies entre personnages :**
- **Flanquement** : +30% dégâts si la cible est adjacente à un allié
- **Ébranler → follow-up** : Si IopLike applique Ébranlé sur un ennemi, le prochain coup d'un allié sur cette cible fait des dégâts bonus (le statut existe déjà mais ne fait rien mécaniquement)
- **Tank + DPS** : émerge naturellement des stats (IopLike 40 PV / 3 DEF absorbe, Sentinelle 22 PV reste derrière)

### Changements techniques

| Fichier | Modification |
|---------|-------------|
| `gameState.ts` | `character` → `characters: CharacterState[]`, ajout `turnQueue: string[]`, `currentTurnIndex` |
| `fightController.ts` | PA/PM par personnage, `getCurrentCharacter()`, `advanceTurn()` |
| `BoardScene.ts` | Multiples sprites joueurs, switch du perso actif par tour, highlights par perso |
| `ai.ts` | `decideEnemyMove/Attack` considère 2 cibles joueurs (le plus proche OU le plus faible) |
| `CharacterCreate.tsx` | UI "choisis 2 parmi 3" au lieu de "choisis 1" |
| `playerState.ts` | `classIds: [string, string]` |
| `GameHUD.tsx` | Afficher le perso actif en grand, le perso inactif en miniature avec PV. Swap auto à chaque tour |

### Nouvel élément UI : Barre d'initiative
Petit bandeau vertical à droite montrant les 4-5 prochains tours (icônes colorées joueur vs ennemi). Donne au joueur l'info pour planifier.

---

## Phase 6 — Enrichissement des classes (PRIORITÉ 2 — Impact fort)

### Objectif
Donner une identité mécanique au Bretteur et à la Sentinelle. Chaque classe doit avoir 1 mécanique unique + 5 sorts (au lieu de 3 sorts génériques).

### Bretteur — Mécanique "Momentum"

Chaque attaque sur la même cible dans le même tour donne +1 stack de Momentum.
À 3 stacks, le prochain sort fait double dégâts et consomme les stacks.

| Sort | Coût | Portée | Dégâts | Effet |
|------|------|--------|--------|-------|
| **Taillade** | 2 PA | 1 | 3 | +1 Momentum |
| **Lame Ardente** | 3 PA | 1 | 6 | +1 Momentum |
| **Estocade** | 2 PA | 2 | 4 | +1 Momentum, portée 2 |
| **Charge** | 3 PA | 3 | 5 | Téléport adjacent à la cible, +1 Momentum |
| **Exécution** | 4 PA | 1 | 4 | Consomme TOUT le Momentum, +3 dégâts par stack |

**Implémentation :** Un simple `Map<enemyId, number>` dans l'état combat du Bretteur. Reset à chaque fin de tour. ~100 lignes de code.

**Pattern de jeu :** Build stacks avec sorts pas chers → finir avec Exécution (potentiellement 4 + 9 = 13 dégâts à 3 stacks).

### Sentinelle — Mécanique "Ligne de Mire"

+2 dégâts bonus par case de distance au-delà de la portée min.
La question centrale : "jusqu'où je peux rester tout en touchant ?"

| Sort | Coût | Portée | Dégâts | Effet |
|------|------|--------|--------|-------|
| **Tir Précis** | 3 PA | 2-6 | 3 | Bénéficie du bonus distance |
| **Flèche Explosive** | 4 PA | 2-5 | 5 | AoE : touche la cible + cases adjacentes |
| **Tir de Couverture** | 2 PA | 2-4 | 2 | Applique "Ralenti" (-1 PM au prochain tour) |
| **Repli** | 2 PA | 0 | 0 | Téléport 3 cases loin de l'ennemi le plus proche |
| **Tir Perforant** | 5 PA | 3-7 | 8 | Ignore la défense, gros nuke |

**Implémentation :** `bonusDamage = max(0, distance - 2) * 2`. Quelques lignes dans le calcul de dégâts. ~50 lignes de code.

---

## Phase 7 — Maps variées & Encounter Design (PRIORITÉ 3 — Effort faible, impact fort)

### Objectif
Chaque salle doit se sentir différente tacticalement et visuellement.

### Layouts d'obstacles (5-8 variantes)

| Layout | Description | Tactique favorisée |
|--------|-------------|-------------------|
| **Champ ouvert** | 2-3 obstacles dispersés | Avantage ranged |
| **Corridor** | Murs créant un passage étroit | Chokepoint, tank devant |
| **Piliers** | Obstacles symétriques au centre | Couvertures, jeu de positions |
| **L-Shape** | Murs en L | Flanquement, angles morts |
| **Embuscade** | Obstacles au centre, ennemis des 2 côtés | Diviser ou regrouper l'équipe ? |

### Changement technique
- `RoomDef` reçoit un champ `obstacles: GridPos[]`
- `createInitialState` lit les obstacles depuis la `RoomDef` au lieu de la constante `OBSTACLE_POSITIONS`
- **Pur travail de données** dans `dungeons.ts`, aucun changement moteur

### Encounter design comme puzzles

Chaque salle pose une question tactique au joueur :
- **"Le problème de l'archer"** : Archer planqué derrière 2 melees. Forcer le passage ou ignorer l'archer ?
- **"Le mur de tank"** : Garde démoniaque bloque un corridor, sorcier derrière. Forcer le tank ou contourner ?
- **"L'embuscade"** : Ennemis des 2 côtés. Splitter l'équipe ou focus un côté ?

---

## Phase 8 — Rééquilibrage loot & difficulté (PRIORITÉ 4 — Effort minimal)

### Problème : le grind
1 ressource par donjon = 2-3 runs identiques pour crafter. Pour un jeu de 1-2h, c'est mortel.

### Solution
- **2-3 ressources par complétion de donjon** (roll multiple de la loot table)
- Le joueur peut crafter après chaque donjon terminé, pas après 3 runs du même
- Boucle serrée : terminer donjon → crafter → se sentir plus fort → avancer

### Problème : le snowball de puissance
Avec stuff T3 (+10 ATK), l'IopLike a 15 ATK contre des ennemis à 2-5 DEF. Jabs fait 19 dégâts → one-shot la plupart des ennemis.

### Solution
- Scaler les PV/stats des ennemis T3 plus agressivement
- Le boss final devrait tenir 5-6 coups, pas 3
- Archidémon : PV 60 → 100-120

---

## Phase 9 — Boss final & Fin du jeu (PRIORITÉ 5)

### Objectif
Le jeu a un climax et une conclusion satisfaisante.

### 5ème donjon : "Trône de l'Archidémon"
- 4 salles, la dernière est le vrai boss fight
- Les 3 premières salles combinent tous les types d'ennemis vus jusque-là
- **Mécanique du boss** : L'Archidémon invoque un bouclier tous les 2 tours qui absorbe le prochain coup entièrement. Un perso doit "casser" le bouclier pour que l'autre puisse infliger de vrais dégâts. Force la coordination des 2 persos.

### Narration minimale (< 100 mots au total)

**Écran de création (3 phrases) :**
> "Le monde souterrain s'éveille. Des créatures monstrueuses remontent des profondeurs, et seuls deux guerriers acceptent de descendre les affronter. Choisis tes champions et plonge dans les ténèbres."

**Avant chaque donjon :** Afficher la description du donjon (existe déjà dans les données, invisible en combat).

**Intro boss final :**
> "L'Archidémon se dresse devant vous, ses yeux brûlants de haine millénaire. C'est lui qui a éveillé les créatures. Détruisez-le, ou le monde sombrera."

**Écran de victoire :**
> "Les ténèbres se dissipent. Le monde souterrain retombe dans le silence. Vos champions émergent à la surface, marqués mais victorieux."

---

## Phase 10 — Polish & Feel (PRIORITÉ 6 — Effort faible)

Les 20% de polish qui donnent 80% de qualité perçue :

| Élément | Impact | Effort | Détail |
|---------|--------|--------|--------|
| **Screen shake** | Fort | 1 ligne | `this.cameras.main.shake()` sur les gros coups (8+ dégâts) |
| **Barre d'initiative** | Fort | Composant React simple | Montre les 4-5 prochains tours |
| **Tooltip ennemis** | Fort | Petit composant | Hover sur un ennemi → voir PV, ATK, DEF, sorts |
| **Intentions ennemies** | Moyen | Icônes au-dessus des ennemis | Avant la phase ennemi, montrer ce que chaque ennemi va faire |
| **2-3 sons** | Moyen | Howler.js/Phaser audio | Hit, kill, lancement de sort |

### Ce qu'on NE fait PAS
- ~~Multijoueur~~ — produit différent, hors scope
- ~~Système de XP / niveaux~~ — la progression par gear suffit
- ~~Génération procédurale~~ — les salles hand-crafted sont meilleures pour un jeu court
- ~~Plus de 3 classes~~ — 3 classes × choix de 2 = 3 combinaisons d'équipe, c'est assez
- ~~Gestion d'inventaire complexe~~ — craft + auto-équip est le bon niveau
- ~~Tutoriel formel~~ — la première salle avec 1 ennemi faible EST le tutoriel
- ~~Musique~~ — effort élevé pour un retour marginal dans un POC
- ~~Difficultés multiples~~ — designer une seule bonne courbe

---

## Résumé des priorités

| # | Phase | Quoi | Pourquoi | Effort |
|---|-------|------|----------|--------|
| 1 | Phase 5 | Équipe de 2 personnages | Transforme la profondeur tactique | **Élevé** |
| 2 | Phase 6 | Enrichir Bretteur & Sentinelle | Sans ça, 2 classes sur 3 sont ennuyeuses | **Moyen** |
| 3 | Phase 7 | Maps variées + encounters designés | Plus gros impact visuel+tactique pour le moindre effort | **Faible** |
| 4 | Phase 8 | Rééquilibrage loot & difficulté | Élimine le grind, pur changement de données | **Faible** |
| 5 | Phase 9 | Boss final + fin du jeu | Donne au jeu une conclusion satisfaisante | **Moyen** |
| 6 | Phase 10 | Polish (shake, tooltips, sons) | Le jeu *se sent* professionnel | **Faible** |

**MVP du fun = Phase 5 + 6 + 7 + 8.** Si le temps manque, les phases 9 et 10 sont du bonus (mais le boss final est important pour l'arc émotionnel).
