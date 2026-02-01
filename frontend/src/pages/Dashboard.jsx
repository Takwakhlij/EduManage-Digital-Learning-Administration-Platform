import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StudentDashboard from './StudentDashboard';

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    console.log('Current User in Dashboard:', user);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Redirect Admin to their specific dashboard
        if (user.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    if (!user) return null;

    // For now, if role is student, teacher, or parent, show StudentDashboard (we can split later)
    // But since the user specifically asked for "Student Dashboard", we'll prioritize that.
    if (user.role === 'student' || user.role === 'teacher' || user.role === 'parent') {
        return <StudentDashboard />;
    }

    return (
        <div className="loading-container">
            <div className="loading-spinner">Chargement...</div>
        </div>
    );
}

export default Dashboard;
