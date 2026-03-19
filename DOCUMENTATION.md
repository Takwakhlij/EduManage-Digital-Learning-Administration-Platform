# Documentation du Projet : Association Coranique

Cette documentation explique la structure complète du projet, le rôle de chaque dossier et fichier clé, les technologies utilisées, et le fonctionnement de l’application.

## 1. Vue d'Ensemble de l'Application (Architecture Générale)
L'application est divisée en deux parties principales :
*   **Frontend (Le Client)** : L'interface utilisateur avec laquelle l'utilisateur interagit (navigateur web). Développé avec **React** et **Vite**.
*   **Backend (Le Serveur)** : Le moteur de l'application qui traite les données, gère la logique métier et se connecte à la base de données. Développé avec **Node.js** et **Express**.
*   **Base de Données** : **MongoDB** (base de données NoSQL) est utilisée pour stocker toutes les données (utilisateurs, classes, matières, cours).

L'application suit le modèle **MERN Stack** (MongoDB, Express, React, Node.js).

### Communication entre Frontend et Backend
1.  **Frontend** : Lorsqu'un utilisateur effectue une action (ex: se connecter), le frontend envoie une requête HTTP (via `axios` ou `fetch` dans Redux) vers l'API du backend (ex: `POST /api/users/login`).
2.  **Backend** : Le backend reçoit la requête, vérifie les données, interroge la base de données (MongoDB) via Mongoose, puis renvoie une réponse JSON (succès, erreur, ou les données demandées).
3.  **Frontend** : Le frontend reçoit la réponse JSON et met à jour l'interface utilisateur (ex: redirige vers le tableau de bord).

---

## 2. Technologies et Bibliothèques Utilisées

### Frontend (`/frontend`)
*   **React** (`react`, `react-dom`) : Bibliothèque principale pour construire l'interface utilisateur.
*   **Vite** : Outil de construction (bundler) ultra-rapide pour React. Remplace Create React App.
*   **React Router Dom** (`react-router-dom`) : Gère la navigation entre les différentes pages sans recharger le navigateur (ex: passer de `/login` à `/dashboard`).
*   **Redux Toolkit** (`@reduxjs/toolkit`, `react-redux`) : Gère l'état global de l'application (ex: stocker les informations de l'utilisateur connecté pour qu'elles soient disponibles sur toutes les pages).
*   **Axios** (`axios`) : Utilisé (parfois via Redux Async Thunks) pour faire des requêtes HTTP vers le backend.
*   **Bootstrap** (`bootstrap`) : Framework CSS pour des composants prêts à l'emploi et une grille responsive.
*   **Lucide React & React Icons** : Bibliothèques d'icônes (utilisées pour les menus, boutons, etc.).
*   **Recharts** (`recharts`) : Bibliothèque pour créer des graphiques (utilisée dans le tableau de bord administrateur).

### Backend (`/backend`)
*   **Node.js** : Environnement d'exécution JavaScript côté serveur.
*   **Express** (`express`) : Framework minimaliste pour Node.js, utilisé pour créer l'API et ses routes.
*   **Mongoose** (`mongoose`) : Bibliothèque ODM (Object Data Modeling) pour MongoDB. Elle permet de structurer les données avec des *schémas* (ex: définir qu'un utilisateur doit avoir un nom, un email, etc.).
*   **Bcryptjs** (`bcryptjs`) : Utilisé pour hacher (crypter) les mots de passe avant de les sauvegarder dans la base de données par sécurité.
*   **JSON-Web-Token** (`jsonwebtoken`) : Utilisé pour l'authentification. Lors de la connexion, le serveur génère un *token* (jeton) qui est renvoyé au frontend. Le frontend utilise ce token pour prouver qu'il est authentifié lors de requêtes futures (routes protégées).
*   **Multer** (`multer`) : Middleware pour gérer l'upload de fichiers temporaires (bien que le projet semble utiliser des images en base64 pour augmenter la limite).
*   **Dotenv** (`dotenv`) : Permet de charger les variables d'environnement depuis le fichier `.env` (ex: URL de la base de données, clé secrète du token) de manière sécurisée sans les exposer dans le code.
*   **Cors** (`cors`) : Permet au frontend (qui tourne sur un port différent, ex: 5173) de faire des requêtes vers le backend (qui tourne sur le port 5000).

---

## 3. Structure du Backend (`/backend`)

Le backend suit le modèle de conception **MVC / API RESTful** (Modèle, Contrôleur, Routes).

*   `server.js` : **Le Point d'Entrée**. Il configure le serveur Express, se connecte à MongoDB, configure les middlewares (comme CORS et la limite de taille JSON pour les images), et lie toutes les API "routes" à l'URL de base (`/api/...`).
*   `/config/db.js` : Contient la logique pour se connecter à la base de données MongoDB à l'aide de l'URL stockée dans `.env`.
*   `/models/` : **La structure des données (Base de données)**.
    *   Chaque fichier (ex: `userModel.js`, `classeModel.js`) définit un *Schéma Mongoose*. Cela indique à MongoDB à quoi doit ressembler un document (ex: l'Utilisateur a un "name", un "email", un "password" et un "role" (admin, prof, étudiant)).
*   `/controllers/` : **Le Cerveau (Logique Métier)**.
    *   Ici se trouve la logique concrète. Par exemple, `userController.js` contient la fonction `loginUser` qui vérifie l'e-mail, compare le mot de passe haché avec `bcrypt`, et génère un token avec `jsonwebtoken`.
    *   Ces fonctions sont appelées quand une route correspondante est visitée.
*   `/routes/` : **Les Chemins d'Accès**.
    *   Définit les URL (ex: `POST /api/users/login`) et les relie aux fonctions des contrôleurs (ex: relier `/login` à la fonction `loginUser`).
*   `/middleware/` : **Les Filtres**.
    *   Exemple: `authMiddleware.js`. Vérifie si l'utilisateur possède un jeton valide (Token JWT) avant de le laisser accéder à une route "protégée" (ex: "Obtenir mon profil").

---

## 4. Structure du Frontend (`/frontend`)

*   `package.json` : Liste des dépendances (React, Vite, etc.) et des scripts (ex: `npm run dev`).
*   `vite.config.js` : Configuration du bundler Vite.
*   `/public/` : Fichiers statiques (images, favicons) qui ne sont pas traités par le bundler dynamique.
*   `/src/` : **Le Cœur de l'Interface Utilisateur**.
    *   `main.jsx` : **Point d'Entrée React**. Remplace l'élément HTML `<div id="root">` par l'application React. Il enveloppe l'application dans `<Provider>` (pour Redux).
    *   `App.jsx` : **Le Navigateur (Router)**. Il utilise `react-router-dom` pour associer des URL (`/dashboard`) à des pages (`<Dashboard />`).
    *   `/pages/` : Les composants React qui représentent une "Écran" complet (ex: `Login.jsx`, `AdminDashboard.jsx`, `LandingPage.jsx`).
    *   `/components/` : Les sous-composants réutilisables (ex: un bouton spécial, une barre de navigation, une Sidebar). `AdminLayout.jsx` gère l'affichage pour l'admin.
    *   `/app/store.js` : Configuration générale de Redux (l'état global).
    *   `/features/` : Logique d'état Redux. Contient les fichiers *Slice* et *Service* (ex: `authSlice.js`, `authService.js`).
        *   Le fichier `Service` fait la requête `axios` HTTP vers le backend.
        *   Le fichier `Slice` met à jour l'état React (ex: isLoading, isError, user data) en fonction du résultat du Service (pending, fulfilled, rejected).
    *   `/context/` : Utilisé pour les états globaux plus simples que Redux, tels que le mode Sombre/Clair (`ThemeContext`) ou le multilinguisme (`LanguageContext`).

## 5. Comment Fonctionne le Flux (Exemple : Connexion)
1. **Frontend (UI) :** L'utilisateur remplit le formulaire sur la page `Login.jsx` et clique sur "Se connecter".
2. **Frontend (Redux) :** La page "dispatch" l'action Redux `login(userData)` depuis `authSlice.js`.
3. **Frontend (Service) :** Le Redux Slice fait appel à `authService.login()`, qui utilise Axios pour envoyer un `POST` au backend sur `/api/users/login`.
4. **Backend (Serveur) :** Le fichier `server.js` voit "Ah, c'est pour `/api/users/login`", et redirige vers `userRoutes.js`.
5. **Backend (Logique) :** `userRoutes.js` connecte la méthode `POST /login` à la fonction `loginUser` dans `userController.js`.
6. **Backend (Base de données) :** `loginUser` interroge la base de données via `userModel.js` (*Existe-t-il un utilisateur avec cet email? Le mot de passe correspond-il?*).
7. **Backend (Réponse) :** `loginUser` génère un *Token JWT* et le renvoie en format JSON `{_id, name, email, token}`.
8. **Frontend (Local) :** `authSlice.js` reçoit ce JSON. Il sauvegarde l'utilisateur dans le conteneur Redux et le *Token* dans le `localStorage` du navigateur (pour s'en souvenir au prochain rechargement).
9. **Frontend (Navigation) :** Dans `Login.jsx`, React voit que nous sommes connectés et utilise `navigate('/dashboard')` pour rediriger l'utilisateur vers son tableau de bord.
