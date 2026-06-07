# HabitKids — Product Knowledge (PK)

---

## 1. Vue d'ensemble

**HabitKids** est une application web et mobile de suivi des habitudes gamifiée, conçue pour aider les parents à motiver leurs enfants à adopter des routines positives au quotidien. Grâce à un système de points (XP), de niveaux, de badges et de récompenses, les enfants s'engagent dans leurs habitudes comme dans un jeu.

| | |
|---|---|
| **Cible** | Parents d'enfants de 4 à 12 ans |
| **Langue** | Français |
| **Plateformes** | Web (navigateur), Android (APK via Capacitor) |
| **Modèle** | Freemium (FREE / PREMIUM) |

---

## 2. Problème résolu

Les enfants ont du mal à maintenir des routines sans rappels constants et sans motivation visible. Les parents passent beaucoup de temps à rappeler les mêmes tâches (se brosser les dents, faire ses devoirs, ranger sa chambre…). HabitKids transforme ces obligations en missions quotidiennes avec des récompenses concrètes et visibles.

---

## 3. Fonctionnalités principales

### Côté parent
- Créer et gérer les profils enfants (photo, prénom, classe, avatar)
- Créer des habitudes depuis une bibliothèque de **40+ habitudes prédéfinies** en français
- **10 catégories** : Hygiène, Éducation, Sport, Nutrition, Sommeil, Créativité, Tâches, Nature, Social, Sécurité
- Personnaliser chaque habitude : emoji, couleur, points, fréquence (quotidienne/hebdomadaire), jours, heure
- Réordonner les habitudes par glisser-déposer
- Créer des **récompenses** (physiques, numériques, privilèges) débloquées avec les XP de l'enfant
- Programmer des **rappels push** (notifications web + FCM Android)
- Consulter les **statistiques hebdomadaires** (graphique en donut : complètes / en cours / manquées)

### Côté enfant
- Dashboard quotidien avec liste des habitudes à cocher
- Suivi XP en temps réel avec barre de progression et **5 niveaux** :
  `Petit explorateur → Apprenti → Champion → Super héros → Légende`
- **Séries (streaks)** de jours consécutifs avec au moins une habitude complétée
- **14 badges** automatiques (première habitude, journée parfaite, séries 3/7/30 jours, niveaux, jalons XP, champion de la semaine)
- Animations de célébration (confettis, sons) sur complétion, montée de niveau, journée parfaite
- Consultation des badges obtenus

---

## 4. Modèle freemium

| Fonctionnalité | FREE | PREMIUM |
|---|---|---|
| Enfants | 1 | Illimité |
| Habitudes par enfant | 5 max | Illimité |
| Récompenses par enfant | 3 max | Illimité |
| Rappels push | 1 max | Illimité |
| Stats avancées | — | ✓ |

---

## 5. Stack technique

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| React | 18.3 | UI |
| TypeScript | — | Typage |
| Vite | 5.3 | Build |
| TailwindCSS | 3.4 | Styles |
| Framer Motion | 11 | Animations |
| Zustand | 4.5 | État global + persistance |
| React Router | 6 | Navigation |
| Axios | 1.7 | Appels API |
| Capacitor | 8.3 | Android (caméra, push) |

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| Fastify | 4.27 | Framework HTTP |
| TypeScript | 5.4 | Typage |
| Prisma | 5.14 | ORM |
| PostgreSQL | — | Base de données |
| Zod | 3.23 | Validation des schémas |
| JWT (@fastify/jwt) | 8.0 | Authentification |
| bcryptjs | 2.4 | Hachage des mots de passe |
| web-push | 3.6 | Notifications Web Push |
| Firebase Admin SDK | 13.10 | Notifications FCM (Android) |

---

## 6. Architecture de déploiement

```
┌──────────────┐      HTTPS       ┌────────────────────────────┐
│   Navigateur │ ◄──────────────► │  Netlify (Frontend)        │
│   ou APK     │                  │  npm run build → dist/     │
│   Android    │                  │  auto-deploy depuis GitHub │
└──────────────┘                  └────────────────────────────┘
       │
       │ HTTPS /api
       ▼
┌──────────────────────────────────────┐
│  Fly.io (Backend — Paris cdg)        │
│  habitkids-api.fly.dev               │
│  shared-cpu-1x · 256 MB RAM          │
│  Fastify + Prisma                    │
└─────────────────┬────────────────────┘
                  │ Prisma ORM
                  ▼
        ┌──────────────────┐
        │  PostgreSQL       │
        │  (Fly.io managed) │
        └──────────────────┘
```

| Composant | Service | URL |
|---|---|---|
| Frontend | Netlify | auto-deploy depuis `master` |
| Backend API | Fly.io | `https://habitkids-api.fly.dev/api` |
| Base de données | PostgreSQL sur Fly.io | attachée au backend |
| Code source | GitHub | `github.com/enan10/habitkids` |

---

## 7. Modèle de données (résumé)

```
User (parent)
  └── Child (profil enfant)
        ├── Habit (habitude)
        │     └── HabitCompletion (complétion par jour)
        ├── Reward (récompense)
        ├── ChildBadge (badges obtenus)
        ├── NotificationSchedule (rappels planifiés)
        ├── PushSubscription (Web Push)
        └── FcmDevice (Android FCM)
```

---

## 8. API — Routes principales

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte parent |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/children` | Lister les enfants |
| POST | `/api/children` | Créer un enfant |
| PATCH | `/api/children/:id` | Modifier le profil enfant |
| POST | `/api/habits` | Créer une habitude |
| PATCH | `/api/habits/:id` | Modifier une habitude |
| POST | `/api/completions` | Valider une habitude (attribue XP, vérifie badges) |
| DELETE | `/api/completions/:habitId` | Annuler une complétion |
| GET | `/api/badges/:childId` | Lister les badges |
| POST | `/api/rewards` | Créer une récompense |
| POST | `/api/rewards/:id/unlock` | Débloquer une récompense (déduit XP) |
| POST | `/api/push/subscribe` | Enregistrer une subscription Web Push |
| POST | `/api/push/fcm-register` | Enregistrer un token FCM Android |

---

## 9. Logique métier clé

### XP & Niveaux
```
Niveau 1 — Petit explorateur   :    0 XP
Niveau 2 — Apprenti            :  100 XP
Niveau 3 — Champion            :  300 XP
Niveau 4 — Super héros         :  600 XP
Niveau 5 — Légende             : 1000 XP
```

### Badges automatiques (14 types)
| Badge | Déclencheur |
|---|---|
| Première habitude | 1ère complétion |
| Journée parfaite | Toutes les habitudes du jour complétées |
| Série 3 / 7 / 30 jours | Streak consécutif atteint |
| Niveau 2 → 5 | Montée de niveau |
| XP 50 / 200 / 500 | Seuil XP atteint |
| Champion de la semaine | 7 complétions en une semaine |

### Notifications
- **Web Push (VAPID)** : navigateurs compatibles (Chrome, Firefox…)
- **Firebase FCM** : APK Android
- Cron interne backend : vérification chaque minute des horaires planifiés → envoi multi-canal

---

## 10. APK Android

| Paramètre | Valeur |
|---|---|
| Fichier | `c:\GITLAB_DIOD\habits\habitkids.apk` |
| API URL | `https://habitkids-api.fly.dev/api` |
| Build | Docker (eclipse-temurin:21-jdk-jammy + Node 22 + Gradle) |
| Fonctionnalités natives | Caméra (photo enfant), Push Notifications (FCM) |

---

## 11. Points de sécurité à adresser

> Ces points sont à corriger avant tout partage public du projet.

- [ ] **GitHub Token PAT** (`ghp_03Ly...`) présent dans l'URL git locale → régénérer s'il a été exposé
- [ ] **JWT_SECRET** en production à remplacer par une valeur aléatoire forte (32+ caractères)
- [ ] **Clés VAPID** dans `docker-compose.yml` → les externaliser en variables d'environnement
- [ ] Vérifier que les secrets Fly.io ne sont pas dans des fichiers committé

---

## 12. Environnement local (Docker Compose)

```env
# PostgreSQL
POSTGRES_HOST=localhost:5432
POSTGRES_DB=habitkids
POSTGRES_USER=habitkids
POSTGRES_PASSWORD=habitkids_dev

# Backend
DATABASE_URL=postgresql://habitkids:habitkids_dev@postgres:5432/habitkids
JWT_SECRET=habitkids-jwt-secret-change-in-production-32ch
FRONTEND_URL=http://localhost
PORT=3000
```

---

*Document généré le 2026-06-07 — HabitKids v1.x*
