# CareMap — Frontend

Application React.js + TypeScript + Vite + Tailwind CSS + Redux Toolkit

## Stack technique
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.1.0
- Tailwind CSS 3.4.1
- Redux Toolkit 2.2.1
- React Router 6.22.1
- Axios 1.6.7
- Leaflet 1.9.4 (carte interactive)
- React Hook Form 7.51.0
- Zod 3.22.4

## Installation

### Prérequis
- Node.js 20.11.0 (via nvm)
- Backend CareMap démarré sur port 3001

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/isteahbalfred/caremap-frontend.git
cd caremap-frontend

# 2. Activer Node 20.11.0
nvm install && nvm use

# 3. Installer les dépendances
npm install

# 4. Configurer l'environnement
copy .env.example .env

# 5. Démarrer le serveur de développement
npm run dev
```

## Application disponible sur
- http://localhost:5173

## Pages disponibles
| Route | Description | Auth |
|-------|-------------|------|
| / | Homepage | Non |
| /search | Recherche médicaments | Non |
| /map | Carte interactive pharmacies | Non |
| /clinics | Liste des cliniques | Non |
| /login | Connexion | Non |
| /register | Inscription | Non |
| /pharmacy | Dashboard pharmacien | PHARMACY_ADMIN |
| /admin | Dashboard administrateur | SUPER_ADMIN |

## Scripts disponibles
```bash
npm run dev          # Démarrage développement
npm run build        # Build production
npm run preview      # Preview build
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript
```

## Structure du projet

frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # Button, Badge, Spinner
│   │   ├── common/      # ProtectedRoute
│   │   └── layout/      # Navbar, layouts
│   ├── pages/
│   │   ├── public/      # HomePage, SearchPage, MapPage, ClinicsPage
│   │   ├── auth/        # LoginPage, RegisterPage
│   │   ├── pharmacy/    # PharmacyDashboard, StockManagement
│   │   └── admin/       # AdminDashboard
│   ├── services/        # Axios services (api, auth, pharmacy, medication, stock, clinic, admin)
│   ├── store/           # Redux store + slices
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Helpers
└── public/

## Variables d'environnement
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_APP_NAME=CareMap
VITE_APP_VERSION=1.0.0
```

## Convention Git
feat(page): description      # Nouvelle page/fonctionnalité
fix(component): description  # Correction bug
style: description           # CSS/UI uniquement
docs: description            # Documentation