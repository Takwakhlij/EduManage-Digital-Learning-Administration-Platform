import Inscription from '../models/inscriptionModel.js';
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';
import Cours from '../models/coursModel.js';
import Seance from '../models/seanceModel.js';
import asyncHandler from 'express-async-handler';
import { sendPushNotification } from './notificationController.js';

// @desc    Mettre à jour le statut d'une inscription (approuvée / refusée)
// @route   PUT /api/inscriptions/:id/statut
export const updateStatutInscription = asyncHandler(async (req, res) => {
    const { statut } = req.body;

    if (!statut || !['approuvee', 'refusee', 'en_attente'].includes(statut)) {
        res.status(400);
        throw new Error("Statut invalide. Valeurs acceptées : 'approuvee', 'refusee', 'en_attente'.");
    }

    const inscription = await Inscription.findById(req.params.id);

    if (!inscription) {
        res.status(404);
        throw new Error("Inscription non trouvée.");
    }

    const previousStatut = inscription.statut;
    inscription.statut = statut;
    await inscription.save();

    const updated = await Inscription.findById(inscription._id)
        .populate('etudiant', 'firstName lastName email _id')
        .populate({
            path: 'session',
            select: 'nomSession montant duree',
            populate: { path: 'enseignants', select: 'firstName lastName' }
        })
        .populate('classe', 'nomClasse niveau');

    // --- NOTIFICATION ÉTUDIANT/PARENT sur changement de statut ---
    if (previousStatut !== statut && updated.etudiant) {
        const student = updated.etudiant;
        const sessionName = updated.session?.nomSession || 'la session';
        const className = updated.classe?.nomClasse || '';

        let notifTitle = '';
        let notifBody = '';

        if (statut === 'approuvee') {
            notifTitle = 'Inscription Approuvée ! 🎉';
            notifBody = `Félicitations ! Votre inscription à la session "${sessionName}"${className ? ` (${className})` : ''} a été approuvée par l'administration. Bienvenue !`;
        } else if (statut === 'refusee') {
            notifTitle = 'Inscription Refusée ❌';
            notifBody = `Votre inscription à la session "${sessionName}"${className ? ` (${className})` : ''} a été refusée. Veuillez contacter l'administration pour plus d'informations.`;
        }

        if (notifTitle) {
            const notifPayload = {
                title: notifTitle,
                body: notifBody,
                type: 'inscription',
                senderId: req.user._id,
                url: '/inscriptions'
            };

            // 1. Notifier l'ÉTUDIANT
            sendPushNotification(student._id, notifPayload).catch(err => console.error('Erreur Push inscription (student):', err));

            // 2. Notifier les PARENTS (si c'est un enfant)
            try {
                const parents = await User.find({ children: student._id, role: 'parent' }).select('_id');
                for (const parent of parents) {
                    sendPushNotification(parent._id, notifPayload).catch(err => console.error('Erreur Push inscription (parent):', err));
                }
            } catch (pErr) {
                console.error('Erreur recherche parents pour notification:', pErr);
            }
        }
    }
    // -------------------------------------------------------------

    res.status(200).json({
        success: true,
        message: `Inscription ${statut === 'approuvee' ? 'approuvée' : statut === 'refusee' ? 'refusée' : 'remise en attente'} avec succès.`,
        inscription: updated
    });
});

// @desc    Supprimer une inscription
// @route   DELETE /api/inscriptions/:id
// @access  Private (Admin)
export const deleteInscription = asyncHandler(async (req, res) => {
    const inscription = await Inscription.findById(req.params.id);

    if (!inscription) {
        res.status(404);
        throw new Error("Inscription non trouvée.");
    }

    await Inscription.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        message: "Inscription supprimée avec succès.",
        id: req.params.id
    });
});

// @desc    Inscrire un étudiant à une session
// @route   POST /api/inscriptions
// @access  Private (Étudiant / Parent)
export const inscrireEtudiant = asyncHandler(async (req, res) => {
    const { etudiant, session } = req.body; 

    // 1. Validation des champs
    if (!etudiant || !session) {
        res.status(400);
        throw new Error("Veuillez fournir l'étudiant et la session.");
    }

    // 2. Sécurité : Vérifier que l'utilisateur a le droit d'inscrire cet étudiant
    // Un étudiant ne peut inscrire que lui-même, un parent peut inscrire ses enfants
    if (req.user.role === 'student' && req.user._id.toString() !== etudiant) {
        res.status(401);
        throw new Error("Non autorisé : Vous ne pouvez pas inscrire un autre étudiant.");
    }

    if (req.user.role === 'parent') {
        const parent = await User.findById(req.user._id);
        if (!parent.children.includes(etudiant)) {
            res.status(401);
            throw new Error("Non autorisé : Cet étudiant n'est pas enregistré comme votre enfant.");
        }
    }

    // 3. Vérifier que la session existe
    const sessionExiste = await Session.findById(session);
    if (!sessionExiste) {
        res.status(404);
        throw new Error("La session spécifiée n'existe pas.");
    }

    const classe = sessionExiste.classe;

    // 4. Vérifier si l'étudiant est déjà inscrit
    const inscriptionExistante = await Inscription.findOne({ etudiant, session });
    if (inscriptionExistante) {
        res.status(400);
        throw new Error("L'étudiant est déjà inscrit à cette session.");
    }

    // 5. Créer l'inscription
    const nouvelleInscription = await Inscription.create({
        etudiant,
        session,
        classe,
        statut: 'en_attente',
        statutPaiement: 'Non Payé' // Par defaut me loul tkoun Non payé 
    });

    res.status(201).json({ 
        success: true,
        message: "Inscription réussie avec succès", 
        inscription: nouvelleInscription 
    });

    // ✅ NOTIFICATION ADMIN : Nouvelle demande de session
    try {
        console.log(`[DEBUG INSCRIPTION] Début notification admin pour étudiant: ${etudiant} et session: ${session}`);
        const student = await User.findById(etudiant).select('firstName lastName');
        const sessionObj = await Session.findById(session).select('nomSession');
        const admins = await User.find({ role: 'admin' }).select('_id');
        
        console.log(`[DEBUG INSCRIPTION] Étudiant: ${student?.firstName}, Session: ${sessionObj?.nomSession}, Admins trouvés: ${admins.length}`);

        if (admins.length > 0) {
            const notifPromises = admins.map(admin => 
                sendPushNotification(admin._id, {
                    title: 'Nouvelle Inscription Session ! 📝',
                    body: `${student?.firstName} ${student?.lastName} s'est inscrit à la session "${sessionObj?.nomSession}".`,
                    type: 'inscription',
                    senderId: etudiant,
                    url: '/admin/inscriptions',
                    relatedId: nouvelleInscription._id
                })
            );
            await Promise.all(notifPromises);
            console.log(`[DEBUG INSCRIPTION] Notifications envoyées aux ${admins.length} admins.`);
        } else {
            console.warn(`[DEBUG INSCRIPTION] Aucun admin trouvé pour recevoir la notification.`);
        }
    } catch (err) {
        console.error('[DEBUG INSCRIPTION ERROR] Erreur notification admin inscription:', err);
    }
});

// @desc    Récupérer les inscriptions d'une session
// @route   GET /api/inscriptions/session/:sessionId
// @access  Private (Admin / Enseignant de la session)
export const getInscriptionsParSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
        res.status(404);
        throw new Error("Session non trouvée.");
    }

    // Sécurité : Seul l'admin ou l'un des enseignants de la session peut voir les inscriptions
    const estEnseignantAssigne = session.enseignants.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (req.user.role !== 'admin' && !estEnseignantAssigne) {
        res.status(401);
        throw new Error("Non autorisé à voir les inscriptions de cette session.");
    }

    const inscriptions = await Inscription.find({ session: req.params.sessionId })
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate('classe', 'nomClasse niveau');

    res.status(200).json({
        success: true,
        count: inscriptions.length,
        inscriptions
    });
});

// @desc    Récupérer les inscriptions de l'étudiant connecté
// @route   GET /api/inscriptions
// @access  Private (Admin)
export const getAllInscriptions = asyncHandler(async (req, res) => {
    // Only Admin can see this global view
    if (req.user.role !== 'admin') {
        res.status(401);
        throw new Error("Non autorisé. Réservé aux administrateurs.");
    }

    const inscriptions = await Inscription.find({})
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate({
            path: 'session',
            select: 'nomSession montant duree statut',
            populate: {
                path: 'enseignants',
                select: 'firstName lastName'
            }
        })
        .populate('classe', 'nomClasse niveau')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: inscriptions.length,
        inscriptions
    });
});



// @desc    Récupérer les inscriptions de l'étudiant CONNECTÉ (espace privé)
// @route   GET /api/inscriptions/my
// @access  Private (Étudiant/Parent)
export const getMyInscriptions = asyncHandler(async (req, res) => {
    // Si c'est un parent, on veut aussi voir les inscriptions de ses enfants
    const searchIds = [req.user._id];
    if (req.user.role === 'parent' && req.user.children) {
        searchIds.push(...req.user.children);
    }

    const inscriptions = await Inscription.find({ etudiant: { $in: searchIds } })
        .populate({
            path: 'session',
            select: 'nomSession duree statut coursPublies imageCouverture montant',
            populate: [
                { path: 'enseignants', select: 'firstName lastName profileImage' },
                { path: 'classe', select: 'nomClasse niveau chapitresTemplate planning matieres', populate: { path: 'matieres', select: 'nomMatiere' } }
            ]
        })
        .populate({ path: 'classe', select: 'nomClasse niveau chapitresTemplate planning matieres', populate: { path: 'matieres', select: 'nomMatiere' } })
        .sort({ createdAt: -1 });

    const daysOrder = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0-6
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    // Ajouter une info de planning dynamique
    const inscriptionsWithSchedule = await Promise.all(inscriptions.map(async (ins) => {
        const obj = ins.toObject();
        if (obj.session) {
            const allSeances = await Seance.find({ session: obj.session._id });
            
            if (allSeances.length > 0) {
                // ... same sorting logic ...
                const sorted = [...allSeances].sort((a, b) => {
                    const idxA = daysOrder.indexOf(a.jour);
                    const idxB = daysOrder.indexOf(b.jour);
                    const getRelDay = (idx) => (idx < currentDayIdx ? idx + 7 : idx);
                    const relA = getRelDay(idxA);
                    const relB = getRelDay(idxB);
                    if (relA !== relB) return relA - relB;
                    return a.heureDebut.localeCompare(b.heureDebut);
                });

                const seancesToday = sorted.filter(s => daysOrder.indexOf(s.jour) === currentDayIdx);
                const nextToday = seancesToday.find(s => s.heureDebut > currentTime);
                const chosen = nextToday || sorted.find(s => daysOrder.indexOf(s.jour) !== currentDayIdx) || sorted[0];
                obj.session.schedule = `${chosen.jour.substring(0, 3)}. ${chosen.heureDebut}`;
            } else {
                obj.session.schedule = "À définir";
            }

            // ✅ CALCULER LE NOMBRE TOTAL DE COURS PUBLIÉS (Modèle indépendant + Legacy)
            const standaloneCount = await Cours.countDocuments({ session: obj.session._id, statut: 'Publié' });
            const legacyCount = obj.session.coursPublies?.length || 0;
            obj.session.totalCours = standaloneCount + legacyCount;
        }
        return obj;
    }));

    res.status(200).json({
        success: true,
        count: inscriptionsWithSchedule.length,
        inscriptions: inscriptionsWithSchedule
    });
});

// @desc    Ajouter/Retirer un cours terminé dans une inscription
// @route   PUT /api/inscriptions/:id/toggle-cours
// @access  Private (Étudiant/Parent)
export const toggleCoursTermine = asyncHandler(async (req, res) => {
    const { coursId } = req.body;
    const inscription = await Inscription.findById(req.params.id).populate('session');

    if (!inscription) {
        res.status(404);
        throw new Error("Inscription non trouvée.");
    }

    // Sécurité : Uniquement l'étudiant concerné ou son parent
    const isOwner = inscription.etudiant.toString() === req.user._id.toString();
    const isParent = req.user.role === 'parent' && (await User.findById(req.user._id)).children.includes(inscription.etudiant);

    if (!isOwner && !isParent && req.user.role !== 'admin') {
        res.status(401);
        throw new Error("Non autorisé à modifier cette progression.");
    }

    // Vérifier si le coursId existe bien et appartient à cette session
    const cours = await Cours.findById(coursId);
    if (!cours || cours.session.toString() !== inscription.session._id.toString()) {
        res.status(400);
        throw new Error("Ce cours n'appartient pas à la session de cette inscription.");
    }

    // Toggle la présence dans l'array
    const index = inscription.coursTermines.indexOf(coursId);
    if (index > -1) {
        inscription.coursTermines.splice(index, 1);
    } else {
        inscription.coursTermines.push(coursId);
    }

    await inscription.save();

    res.status(200).json({
        success: true,
        message: "Progression mise à jour",
        coursTermines: inscription.coursTermines
    });
});