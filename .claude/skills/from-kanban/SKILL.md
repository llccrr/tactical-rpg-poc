---
name: from-kanban
description: Travailler sur un ticket du Kanban Notion du projet tactical-rpg-poc (Pikachu Dungeon Rusher). Explique où trouver le Kanban, comment récupérer un ticket et la discipline de mise à jour du statut quand on le prend en dev.
---

# From Kanban

Le Kanban du projet **n'est pas dans GitHub Issues**, il est dans Notion.

## Emplacement du Kanban

- **Page projet** : "🎮 Pikachu Dungeon Rusher" — id `347715732d90805baed8d4417e8328bd`
- **Base Backlog** : id `099ef62ffb8a4dacb0f75811afc36030`
- **Data source** : `collection://499cd391-4002-4131-91e1-76c5c8273074`

Pour chercher un ticket : utiliser `notion-search` (ou `mcp__notion__notion-search`) sur la base Backlog, **pas** `gh issue list`.

## Schéma des tickets

- **Statut** : `À faire` / `Idée` / `To scope` / `En cours` / `En test` / `Terminé`
- **Priorité** : `Haute` / `Moyenne` / `Basse`
- **Catégorie** : `Game Design` / `Programmation` / `Art 3D` / `Level Design` / `Audio` / `UI/UX` / `Divers`

Les dépendances sont listées dans une section `## Blocked by` du ticket (souvent préfixée `#0 HITL` pour le ticket de décision initial).

## Processus quand on prend un ticket en dev

### 1. Identifier le ticket

Si l'utilisateur référence "ticket #X", "la tâche Y", ou un titre, le retrouver via `notion-search` sur la data source ci-dessus.

### 2. Lire le ticket en entier

Utiliser `notion-fetch` sur l'URL/id du ticket pour récupérer :
- La description complète
- La section `## Blocked by` (si présente) — vérifier que les bloqueurs sont résolus avant de commencer
- Les critères d'acceptation

### 3. **Passer le ticket en "En cours"**

**C'est une étape obligatoire dès qu'on commence à coder sur le ticket.** Mettre à jour la propriété `Statut` du ticket à `En cours` via `mcp__notion__notion-update-page`.

Ne pas oublier : si on ne le fait pas, le Kanban ne reflète plus la réalité et les autres contributeurs ne savent pas que la tâche est prise.

### 4. Travailler sur le ticket

Implémenter, tester, committer comme d'habitude.

### 5. Passer en "En test" quand le dev est terminé

Quand le code est poussé et prêt à être validé, mettre le statut à `En test` (pas directement `Terminé` — la validation passe par la phase de test).

### 6. `Terminé` uniquement après validation

Le passage à `Terminé` se fait après validation fonctionnelle, pas à la fin du dev.

## Résumé des transitions

```
À faire / To scope  →  En cours  →  En test  →  Terminé
                      (au démarrage du dev)  (après push)   (après validation)
```

Le point critique : **toujours** faire la transition `À faire → En cours` au moment où on commence à travailler, et non après coup.
