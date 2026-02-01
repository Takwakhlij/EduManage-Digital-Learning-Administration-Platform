import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, User, Mail, Phone, Lock, ChevronLeft } from 'lucide-react';
import { updateProfile, reset } from '../features/auth/authSlice';
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

    const { firstName, lastName, email, phoneNumber, password, confirmPassword } = formData;

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }

        if (isError) {
            alert(message);
        }

        if (isSuccess) {
            alert('Profil mis à jour avec succès !');
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

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
        }

        if (password) {
            formDataToSend.append('password', password);
        }

        dispatch(updateProfile(formDataToSend));
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
                                <div className="avatar-text">
                                    <h2>Photo de Profil</h2>
                                    <p>Cliquez sur l&apos;icône pour changer votre photo</p>
                                </div>
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
                </div>
            </div>
        </div>
    );
}

export default Profile;
