// Importation de React Router pour la navigation SPA (Single Page Application)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './islamic-elements.css';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Importation des différentes Pages  de l'application
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

import TeacherDashboard from './pages/TeacherDashboard';
import TeacherSessionDetails from './pages/TeacherSessionDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import ClassesList from './pages/ClassesList';
import MatieresList from './pages/MatieresList';
import AdminMembers from './pages/AdminMembers';
import StudentInscriptions from './pages/StudentInscriptions';
import Formations from './pages/Formations';
import SessionsList from './pages/SessionsList';
import InscriptionsList from './pages/InscriptionsList';
import AdminTeacherPresences from './pages/AdminTeacherPresences';
import AdminStudentPresences from './pages/AdminStudentPresences';
import GlobalCalendar from './pages/GlobalCalendar';
import EnseignantCalendar from './pages/EnseignantCalendar';
import StudentSchedule from './pages/StudentSchedule';
import StudentPresence from './pages/StudentPresence';
import StudentPaiements from './pages/StudentPaiements';
import AdminLayout from './components/AdminLayout'; // Composant qui structure l'interface Admin (Sidebar + NavBar)

function App() {
  return (
    // Les *Providers* enveloppent l'application pour fournir des données à tous les composants enfants
    <ThemeProvider>
      <LanguageProvider>
        {/* Router : Gère l'historique de navigation de l'utilisateur dans le navigateur web */}
        <Router>
          {/* Routes : Vérifie l'URL actuelle et affiche le composant de Route correspondant */}
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes "Protégées" (L'accès est géré dans les composants eux-mêmes, ex: redirection si non connecté) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inscriptions" element={<StudentInscriptions />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/sessions/:id" element={<TeacherSessionDetails />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Planning Général: standalone fullscreen (no AdminLayout sidebar) */}
            <Route path="/admin/planning" element={<GlobalCalendar />} />

            {/* Emploi du Temps Enseignant: standalone fullscreen (no layout) */}
            <Route path="/teacher/planning" element={<EnseignantCalendar />} />

            {/* Emploi du Temps Étudiant */}
            <Route path="/planning" element={<StudentSchedule />} />

            {/* Dashboard Présence Étudiant */}
            <Route path="/presence" element={<StudentPresence />} />

            {/* Historique Paiements Étudiant */}
            <Route path="/paiements" element={<StudentPaiements />} />

            {/* Routes d'administration "Imbriquées" avec un Layout commun (Sidebar partagée) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} /> 
              <Route path="classes" element={<ClassesList />} /> 
              <Route path="matieres" element={<MatieresList />} /> 
              <Route path="membres" element={<AdminMembers />} /> 
              <Route path="sessions" element={<SessionsList />} />
              <Route path="inscriptions" element={<InscriptionsList />} />
              <Route path="presences-enseignants" element={<AdminTeacherPresences />} />
              <Route path="presences-etudiants" element={<AdminStudentPresences />} />
            </Route>

            <Route path="/profile" element={<Profile />} />

            {/* Route Catch-all : Si l'utilisateur tape une URL qui n'existe pas, on le redirige vers /login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
