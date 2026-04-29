import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getActualites, createActualite, deleteActualite, updateActualite } from '../features/actualites/actualiteSlice';
import { Plus, Edit2, Trash2, Image as ImageIcon, Calendar, Megaphone, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminActualites.css';

const AdminActualites = () => {
    const dispatch = useDispatch();
    const { actualites, isLoading } = useSelector((state) => state.actualites);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({ titre: '', description: '', dateEvenement: '', image: null });
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        dispatch(getActualites());
    }, [dispatch]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const openModal = (actualite = null) => {
        if (actualite) {
            setIsEditing(true);
            setCurrentId(actualite._id);
            setFormData({ titre: actualite.titre, description: actualite.description, dateEvenement: actualite.dateEvenement ? actualite.dateEvenement.substring(0, 10) : '', image: null });
            setPreviewImage(`http://localhost:5000${actualite.image}`);
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData({ titre: '', description: '', dateEvenement: '', image: null });
            setPreviewImage(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ titre: '', description: '', dateEvenement: '', image: null });
        setPreviewImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEditing && !formData.image) {
            toast.error('Veuillez sélectionner une image.');
            return;
        }
        const data = new FormData();
        data.append('titre', formData.titre);
        data.append('description', formData.description);
        data.append('dateEvenement', formData.dateEvenement || '');
        if (formData.image) data.append('image', formData.image);

        try {
            if (isEditing) {
                await dispatch(updateActualite({ id: currentId, actualiteData: data })).unwrap();
                toast.success('Actualité modifiée avec succès');
            } else {
                await dispatch(createActualite(data)).unwrap();
                toast.success('Actualité ajoutée avec succès');
            }
            closeModal();
        } catch (error) {
            toast.error(error || 'Une erreur est survenue');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette actualité ?')) {
            try {
                await dispatch(deleteActualite(id)).unwrap();
                toast.success('Actualité supprimée');
            } catch (error) {
                toast.error(error || 'Erreur lors de la suppression');
            }
        }
    };

    return (
        <div className="act-page">
            {/* En-tête */}
            <div className="act-header">
                <div className="act-header-text">
                    <div className="act-header-icon-wrap">
                        <Megaphone size={22} />
                    </div>
                    <div>
                        <h1>Gestion des Actualités</h1>
                        <p>Publiez des annonces et événements sur la page d'accueil</p>
                    </div>
                </div>
                <button className="act-add-btn" onClick={() => openModal()}>
                    <Plus size={18} />
                    Ajouter une actualité
                </button>
            </div>

            {/* Tableau */}
            <div className="act-table-wrapper">
                {isLoading && actualites.length === 0 ? (
                    <div className="act-loading">Chargement...</div>
                ) : actualites.length === 0 ? (
                    <div className="act-empty">
                        <Megaphone size={48} />
                        <p>Aucune actualité pour le moment.</p>
                        <button className="act-add-btn" onClick={() => openModal()}>
                            <Plus size={16} /> Ajouter la première actualité
                        </button>
                    </div>
                ) : (
                    <table className="act-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Titre & Description</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actualites.map((act) => (
                                <tr key={act._id}>
                                    <td>
                                        <div className="act-thumb">
                                            <img src={`http://localhost:5000${act.image}`} alt={act.titre} />
                                        </div>
                                    </td>
                                    <td>
                                        <strong className="act-title-cell">{act.titre}</strong>
                                        <span className="act-desc-cell">{act.description}</span>
                                    </td>
                                    <td>
                                        <span className="act-date-badge">
                                            <Calendar size={13} />
                                            {act.dateEvenement
                                                ? new Date(act.dateEvenement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : new Date(act.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <div className="act-actions">
                                            <button className="act-btn-edit" onClick={() => openModal(act)} title="Modifier">
                                                <Edit2 size={15} />
                                            </button>
                                            <button className="act-btn-delete" onClick={() => handleDelete(act._id)} title="Supprimer">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="act-modal-overlay" onClick={closeModal}>
                    <div className="act-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="act-modal-header">
                            <h2>{isEditing ? "Modifier l'actualité" : 'Nouvelle actualité'}</h2>
                            <button className="act-modal-close" onClick={closeModal}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="act-modal-form">
                            <div className="act-form-group">
                                <label>Titre *</label>
                                <input
                                    type="text"
                                    name="titre"
                                    value={formData.titre}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Ex: Cérémonie de remise des prix"
                                />
                            </div>

                            <div className="act-form-group">
                                <label>Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="4"
                                    placeholder="Détails de l'événement..."
                                />
                            </div>

                            <div className="act-form-group">
                                <label>Date de l'événement <span style={{ color: '#94a3b8', fontWeight: '400' }}>(optionnel)</span></label>
                                <input
                                    type="date"
                                    name="dateEvenement"
                                    value={formData.dateEvenement}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="act-form-group">
                                <label>Image de couverture {isEditing ? '(Optionnel)' : '*'}</label>
                                <input
                                    type="file"
                                    id="act-img-input"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="act-img-input" className="act-file-label">
                                    <ImageIcon size={18} />
                                    Choisir une image depuis votre PC
                                </label>
                                {previewImage && (
                                    <div className="act-preview">
                                        <img src={previewImage} alt="Aperçu" />
                                    </div>
                                )}
                            </div>

                            <div className="act-modal-actions">
                                <button type="button" className="act-btn-cancel" onClick={closeModal}>
                                    Annuler
                                </button>
                                <button type="submit" className="act-btn-submit" disabled={isLoading}>
                                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminActualites;
