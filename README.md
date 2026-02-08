# Evora - Plateforme de Gestion d'Événements

Authored by **Abdel Ilah ESSEMLALI**

Evora est une application web moderne (SaaS) conçue pour simplifier la création d'événements et la gestion des réservations. Ce projet est un monorepo comprenant un backend robuste et un frontend intuitif.

---

## Architecture Globale

Le projet repose sur une architecture **Monorepo** découplée, facilitant le déploiement et la maintenance.

### Backend (Dossier `/backend`)
- **Technologie** : [NestJS](https://nestjs.com/) (Node.js v20).
- **Base de données** : [PostgreSQL](https://www.postgresql.org/).
- **ORM** : [Prisma](https://www.prisma.io/) pour une manipulation typée des données.
- **Sécurité** : Authentification via JWT (JSON Web Tokens) et cryptage des mots de passe avec Bcrypt.
- **Journalisation** : Winston pour des logs structurés.
- **Fonctionnalités Clés** :
  - API RESTful.
  - Génération de tickets PDF dynamiques via `pdfkit`.
  - Validation des entrées avec `class-validator`.

### Frontend (Dossier `/frontend`)
- **Technologie** : [Next.js](https://nextjs.org/) (React).
- **Gestion d'État** : Redux Toolkit.
- **Interface Utilisateur** : Tailwind CSS, Shadcn UI et Lucide React pour une esthétique premium.
- **API Client** : Axios pour les requêtes asynchrones.
- **Validation** : Zod et React Hook Form.

### 🐳 Infrastructure
- **Conteneurisation** : Docker et Docker Compose pour orchestrer PostgreSQL, le Backend et le Frontend.
- **CI/CD** : GitHub Actions pour l'automatisation du linting, des tests et du build.

---

## Guide d'Installation et Configuration

### Prérequis
- [Node.js](https://nodejs.org/) (v20 ou supérieur).
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/).

### 1. Cloner le projet
```bash
git clone https://github.com/Abdo-esse/Evora.git
cd Evora
```

### 2. Configuration des variables d'environnement
Créez un fichier `.env` dans le dossier `backend/` et `frontend/` en vous basant sur les fichiers `.env.exemple` fournis.

**Backend (`backend/.env`) :**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/evora_db"
JWT_SECRET="votre_secret_tres_long"
```

### 3. Lancer avec Docker (Recommandé)
```bash
docker-compose up --build
```
L'application sera accessible sur :
- **Frontend** : `http://localhost:3001`
- **Backend** : `http://localhost:3002`

### 4. Installation Locale (Développement)
**Backend :**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

**Frontend :**
```bash
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```

---

## Règles Métier Implémentées

### Gestion des Rôles
- **ADMIN_ORG** : Peut créer, modifier et supprimer des événements. Il a une vue globale sur toutes les réservations.
- **PARTICIPANT** : Peut consulter les événements publiés, effectuer une réservation et télécharger son ticket PDF.

### Gestion des Événements
- **Statuts** : `DRAFT` (Brouillon), `PUBLISHED` (Publié), `CANCELED` (Annulé).
- Seuls les événements au statut `PUBLISHED` sont visibles par les participants.
- La capacité de l'événement est strictement contrôlée.

### Système de Réservation
- **Unicité** : Un participant ne peut réserver qu'une seule place par événement.
- **Flux de validation** :
  - La réservation commence au statut `PENDING`.
  - L'administrateur peut la passer en `CONFIRMED` ou `REFUSED`.
  - Le participant peut annuler sa réservation (`CANCELED`).
- **Capacité** : Une réservation ne peut être confirmée que si le nombre de places restantes est suffisant.
- **Ticket** : Un ticket PDF avec QR Code (potentiel) et informations de l'événement n'est généré que pour les réservations `CONFIRMED`.

---

## Tests & Qualité
- **Backend** : Tests unitaires avec Jest.
- **Frontend** : Tests composants et tests E2E avec Playwright.
- **Linting** : ESLint et Prettier pour un code propre et cohérent.