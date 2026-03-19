import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCours } from '../features/cours/coursSlice';
import { X, UploadCloud, Link } from 'lucide-react';
import './AddDocumentModal.css';

function AddDocumentModal({ isOpen, onClose, sessionId, chapitre }) {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.cours);
    
    const [titre, setTitre] = useState('');
    const [typeSupport, setTypeSupport] = useState('Fichier local');
    const [file, setFile] = useState(null);
    const [lienUrl, setLienUrl] = useState('');
    const [formError, setFormError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!titre.trim()) {
            return setFormError('Le titre est requis.');
        }

        if (typeSupport === 'Fichier local' && !file) {
            return setFormError('Veuillez sélectionner un fichier.');
        }

        if (typeSupport === 'Lien externe' && !lienUrl.trim()) {
            return setFormError('Veuillez fournir une URL valide.');
        }

        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('sessionId', sessionId);
        if (chapitre?._id) {
            formData.append('chapitreId', chapitre._id);
        }
        formData.append('statut', 'Publié'); // Auto-publié
        formData.append('typeSupport', typeSupport);

        if (typeSupport === 'Fichier local') {
            formData.append('fichier', file);
        } else {
            formData.append('lienUrl', lienUrl);
        }

        const result = await dispatch(createCours(formData));
        
        if (createCours.fulfilled.match(result)) {
            // Re-initialiser le form et fermer
            setTitre('');
            setFile(null);
            setLienUrl('');
            setTypeSupport('Fichier local');
            onClose();
        } else {
            setFormError(result.payload || "Une erreur est survenue lors de l'ajout du document.");
        }
    };

    return (
        <div className="doc-modal-overlay">
            <div className="doc-modal-container">
                <button className="doc-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>
                
                <div className="doc-modal-header">
                    <h2>Ajouter une ressource</h2>
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
                            <p className="doc-dropzone-title">Glissez-déposez votre fichier ici</p>
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
                        <button type="button" className="doc-btn-cancel" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </button>
                        <button type="submit" className="doc-btn-submit" disabled={isLoading}>
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddDocumentModal;
