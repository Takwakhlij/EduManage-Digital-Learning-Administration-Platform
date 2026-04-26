import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCours, updateCours } from '../features/cours/coursSlice';
import { X, UploadCloud, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import './AddDocumentModal.css';

function AddDocumentModal({ isOpen, onClose, sessionId, chapitre, editingDoc }) {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.cours);
    
    const [titre, setTitre] = useState('');
    const [typeSupport, setTypeSupport] = useState('Fichier local');
    const [file, setFile] = useState(null);
    const [lienUrl, setLienUrl] = useState('');
    const [formError, setFormError] = useState('');

    // Pre-fill form when editing
    useEffect(() => {
        if (editingDoc) {
            setTitre(editingDoc.titre || '');
            const isExternal = editingDoc.fichier?.startsWith('http');
            if (isExternal) {
                setTypeSupport('Lien externe');
                setLienUrl(editingDoc.fichier || '');
            } else {
                setTypeSupport('Fichier local');
            }
            setFile(null);
            setFormError('');
        } else {
            // Reset form for new document
            setTitre('');
            setTypeSupport('Fichier local');
            setFile(null);
            setLienUrl('');
            setFormError('');
        }
    }, [editingDoc, isOpen]);

    if (!isOpen) return null;

    const isEditing = !!editingDoc;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!titre.trim()) {
            return setFormError('Le titre est requis.');
        }

        if (!isEditing && typeSupport === 'Fichier local' && !file) {
            return setFormError('Veuillez sélectionner un fichier.');
        }

        if (typeSupport === 'Lien externe' && !lienUrl.trim()) {
            return setFormError('Veuillez fournir une URL valide.');
        }

        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('statut', 'Publié');
        formData.append('typeSupport', typeSupport);

        if (!isEditing) {
            // Creating new document
            formData.append('sessionId', sessionId);
            if (chapitre?._id) {
                formData.append('chapitreId', chapitre._id);
            }
        }

        if (typeSupport === 'Fichier local' && file) {
            formData.append('fichier', file);
        } else if (typeSupport === 'Lien externe') {
            formData.append('lienUrl', lienUrl);
        }

        let result;
        if (isEditing) {
            result = await dispatch(updateCours({ id: editingDoc._id, coursData: formData }));
            if (updateCours.fulfilled.match(result)) {
                toast.success("Ressource modifiée avec succès !");
                resetAndClose();
            } else {
                const errorMsg = result.payload || "Une erreur est survenue lors de la modification.";
                toast.error(errorMsg);
                setFormError(errorMsg);
            }
        } else {
            result = await dispatch(createCours(formData));
            if (createCours.fulfilled.match(result)) {
                toast.success("Ressource ajoutée avec succès !");
                resetAndClose();
            } else {
                const errorMsg = result.payload || "Une erreur est survenue lors de l'ajout du document.";
                toast.error(errorMsg);
                setFormError(errorMsg);
            }
        }
    };

    const resetAndClose = () => {
        setTitre('');
        setFile(null);
        setLienUrl('');
        setTypeSupport('Fichier local');
        setFormError('');
        onClose();
    };

    return (
        <div className="doc-modal-overlay">
            <div className="doc-modal-container">
                <button className="doc-modal-close" onClick={resetAndClose}>
                    <X size={20} />
                </button>
                
                <div className="doc-modal-header">
                    <h2>{isEditing ? 'Modifier la ressource' : 'Ajouter une ressource'}</h2>
                    {isEditing && (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                            Modifiez les informations du document ci-dessous.
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="doc-modal-form">
                    {formError && <div className="doc-modal-error">{formError}</div>}
                    
                    <div className="doc-form-group">
                        <label>Titre du document</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Introduction au Tawhid.pdf" 
                            value={titre} 
                            onChange={(e) => setTitre(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="doc-form-group">
                        <div className="doc-type-selector">
                            <button 
                                type="button" 
                                className={`doc-type-btn ${typeSupport === 'Fichier local' ? 'active' : ''}`}
                                onClick={() => setTypeSupport('Fichier local')}
                            >
                                <span style={{ display: 'none' }}><UploadCloud size={18} /></span> Fichier Local
                            </button>
                            <button 
                                type="button" 
                                className={`doc-type-btn ${typeSupport === 'Lien externe' ? 'active' : ''}`}
                                onClick={() => setTypeSupport('Lien externe')}
                            >
                                <Link size={18} /> Lien externe
                            </button>
                        </div>
                    </div>

                    {typeSupport === 'Fichier local' && (
                        <div className="doc-dropzone">
                            <UploadCloud size={32} className="doc-upload-icon" />
                            <p className="doc-dropzone-title">
                                {isEditing ? 'Remplacer le fichier (optionnel)' : 'Glissez-déposez votre fichier ici'}
                            </p>
                            <p className="doc-dropzone-or">ou</p>
                            <label className="doc-browse-btn">
                                Parcourir les fichiers
                                <input 
                                    type="file" 
                                    style={{ display: 'none' }}
                                    onChange={(e) => setFile(e.target.files[0])}
                                    disabled={isLoading}
                                    accept=".pdf,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg,.jpg,.png"
                                />
                            </label>
                            <p className="doc-dropzone-hints">PDF, Vidéo (MP4, MOV) - Max 100MB</p>
                            {file && <p className="doc-selected-file">Fichier sélectionné : {file.name}</p>}
                            {isEditing && !file && editingDoc?.fichier && (
                                <p className="doc-selected-file" style={{ color: '#fbbf24' }}>
                                    Fichier actuel : {editingDoc.fichier.split('/').pop()}
                                </p>
                            )}
                        </div>
                    )}

                    {typeSupport === 'Lien externe' && (
                        <div className="doc-form-group">
                            <label>URL de la ressource</label>
                            <input 
                                type="url" 
                                placeholder="https://exemple.com/ressource" 
                                value={lienUrl} 
                                onChange={(e) => setLienUrl(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    <div className="doc-modal-footer">
                        <button type="button" className="doc-btn-cancel" onClick={resetAndClose} disabled={isLoading}>
                            Annuler
                        </button>
                        <button type="submit" className="doc-btn-submit" disabled={isLoading}>
                            {isLoading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddDocumentModal;
