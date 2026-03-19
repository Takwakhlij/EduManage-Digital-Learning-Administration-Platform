import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, User, Mail, Phone, Lock, ChevronLeft, Trash2 } from 'lucide-react';
import { updateProfile, deactivateAccount, logout, reset } from '../features/auth/authSlice';
import './Profile.css';

function Profile() {
    const { user, isSuccess, message, isError } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        password: '',
        confirmPassword: '',
    });

    const [imagePreview, setImagePreview] = useState(user?.profileImage || '');
    const [selectedFile, setSelectedFile] = useState(null);

    const [updateInitiated, setUpdateInitiated] = useState(false);
    const [deleteImage, setDeleteImage] = useState(false);

    const { firstName, lastName, email, phoneNumber, password, confirmPassword } = formData;

    // Reset state on mount to ensure clean slate
    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }

        if (isError) {
            alert(message);
            setUpdateInitiated(false); // Reset on error
        }

        if (isSuccess && updateInitiated) {
            // Redirect with success message in state
            dispatch(reset());
            navigate('/', { state: { successMessage: 'Profil mis à jour avec succès !' } });
        }
    }, [user, isError, isSuccess, message, navigate, dispatch, updateInitiated]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Store the actual file for upload
            setSelectedFile(file);

            // Create preview URL for display
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }

        // Create FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('firstName', firstName);
        formDataToSend.append('lastName', lastName);
        formDataToSend.append('email', email);
        formDataToSend.append('phoneNumber', phoneNumber);

        if (selectedFile) {
            formDataToSend.append('profileImage', selectedFile);
        } else if (deleteImage) {
            formDataToSend.append('profileImage', 'null');
        }

        if (password) {
            formDataToSend.append('password', password);
        }

        setUpdateInitiated(true);
        dispatch(updateProfile(formDataToSend));
    };

    const handleDeactivate = async () => {
        const confirmed = window.confirm(
            '⚠️ Voulez-vous vraiment désactiver votre compte ?\n\nVotre compte passera en mode inactif. Vous serez déconnecté(e) immédiatement.\nSeul un administrateur pourra le réactiver.'
        );
        if (!confirmed) return;
        await dispatch(deactivateAccount());
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="profile-page">
            <div className="top-border"></div>

            <div className="profile-wrapper">
                <header className="profile-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ChevronLeft size={24} />
                        <span>Retour</span>
                    </button>
                    <h1>Mon Profil</h1>
                </header>

                <div className="profile-content">
                    <form onSubmit={onSubmit}>
                        {/* Photo Section */}
                        <div className="profile-card photo-section">
                            <div className="avatar-upload">
                                <div className="avatar-preview">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview.startsWith('http') || imagePreview.startsWith('data:')
                                                ? imagePreview
                                                : `http://localhost:5000${imagePreview}`
                                            }
                                            alt="Preview"
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {firstName?.charAt(0)}
                                        </div>
                                    )}
                                    <label htmlFor="image-upload" className="upload-label">
                                        <Camera size={20} />
                                    </label>
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        hidden
                                    />
                                </div>
                                <h2>Photo de Profil</h2>
                                <p>Cliquez sur l'icône pour changer votre photo</p>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        className="delete-photo-btn"
                                        onClick={() => {
                                            if (window.confirm('Voulez-vous vraiment supprimer votre photo ?')) {
                                                setImagePreview('');
                                                setSelectedFile(null);
                                                setFormData(prev => ({ ...prev })); // Trigger re-render need? Not really but safe.
                                                // We need a way to tell submit to send 'null'
                                                // Let's use a ref or just state. 
                                                // Ideally we set selectedFile to 'DELETE' or something distinct?
                                                // Or just use a separate state `shouldDeleteImage`
                                            }
                                        }}
                                        style={{
                                            marginTop: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 12px',
                                            background: '#fee2e2',
                                            color: '#ef4444',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <Trash2 size={16} /> Supprimer la photo
                                    </button>
                                )}
                            </div>
                        </div>


                        {/* Info Section */}
                        <div className="profile-card">
                            <h3 className="card-title">Informations Personnelles</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><User size={16} /> Prénom</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={firstName}
                                        onChange={onChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><User size={16} /> Nom</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={lastName}
                                        onChange={onChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Mail size={16} /> Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={onChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Phone size={16} /> Téléphone</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={phoneNumber}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="profile-card">
                            <h3 className="card-title">Sécurité <small>(Laissez vide pour ne pas changer)</small></h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><Lock size={16} /> Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={password}
                                        onChange={onChange}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Lock size={16} /> Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={onChange}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-save">
                                <Save size={20} />
                                Enregistrer les modifications
                            </button>
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="profile-card" style={{
                        border: '1.5px solid #fee2e2',
                        background: '#fff8f8',
                        marginTop: '16px'
                    }}>
                        <h3 className="card-title" style={{ color: '#dc2626' }}>⚠️ Zone de danger</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>
                            La désactivation de votre compte vous déconnectera immédiatement. Votre compte deviendra inactif et vous ne pourrez plus vous connecter. Seul un administrateur peut réactiver votre compte par la suite.
                        </p>
                        <button
                            type="button"
                            onClick={handleDeactivate}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: 'white',
                                color: '#dc2626',
                                border: '1.5px solid #dc2626',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#dc2626'; }}
                        >
                            <Trash2 size={16} /> Désactiver mon compte
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default Profile;
