import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './islamic-elements.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import ClassesList from './pages/ClassesList';
import MatieresList from './pages/MatieresList';
// import CreateClasse from './pages/CreateClasse'; // Removed
// import EditClasse from './pages/EditClasse'; // Removed
import AdminLayout from './components/AdminLayout';
import CreateClasseModal from './components/CreateClasseModal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="classes" element={<ClassesList />} />
          <Route path="matieres" element={<MatieresList />} />
          {/* <Route path="classes/create" element={<CreateClasse />} /> // Removed */}
          {/* <Route path="classes/edit/:id" element={<EditClasse />} /> // Removed */}
        </Route>
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
