import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset, getMe } from '../features/auth/authSlice';
import StudentDashboard from './StudentDashboard';

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    console.log('Current User in Dashboard:', user);

    const [selectedChild, setSelectedChild] = useState(null);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    // Initial data fetch
    useEffect(() => {
        if (user && user.role !== 'admin') {
            dispatch(getMe());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only on mount

    // Redirect & Parent Logic
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Redirect Admin
        if (user.role === 'admin') {
            navigate('/admin', { state: location.state });
        }

        // Parent Logic: Select first child if none selected
        if (user.role === 'parent' && !selectedChild && user.children && user.children.length > 0) {
            setSelectedChild(user.children[0]);
        }
    }, [user, navigate, location.state, selectedChild]);

    if (!user) return null;

    // Parent View (Student Proxy)
    if (user.role === 'parent') {


        return (
            <StudentDashboard
                effectiveUser={selectedChild}
                parentUser={user}
                onSwitchChild={setSelectedChild}
                successMessage={location.state?.successMessage}
            />
        );
    }

    // For now, if role is student or teacher, show StudentDashboard (we can split later)
    if (user.role === 'student' || user.role === 'teacher') {
        return <StudentDashboard successMessage={location.state?.successMessage} />;
    }

    return (
        <div className="loading-container">
            <div className="loading-spinner">Chargement...</div>
        </div>
    );
}

export default Dashboard;
