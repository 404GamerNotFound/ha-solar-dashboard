# HA Solar Dashboard Card (Français)

Une carte Lovelace Home Assistant personnalisée pour HACS, avec une vue moderne de l'énergie/PV basée sur une image.

## Exemple

![HA Solar Dashboard Card example](images/home.png)

## Fonctionnalités

- Image d'arrière-plan (maison/design PV)
- Basculement automatique jour/nuit via `sun.sun` (`*_tag.png` en journée)
- Widgets superposés avec positionnement X/Y libre
- Modèles de maisons sélectionnables depuis `images`
- Entités configurables (PV, batterie, onduleur, wallbox, puissance totale)
- Masquage possible de boîtes individuelles

## Installation (HACS)

1. Ajoutez ce dépôt dans HACS comme **Custom repository** de type **Dashboard**.
2. Installez **HA Solar Dashboard Card**.
3. Redémarrez Home Assistant (ou rechargez les ressources).
4. Ajoutez la carte dans Lovelace.

> Pour toutes les options de configuration détaillées, consultez la README anglaise standard : [README.md](README.md)
