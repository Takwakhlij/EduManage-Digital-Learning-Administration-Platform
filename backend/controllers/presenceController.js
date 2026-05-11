import asyncHandler from 'express-async-handler';
import Presence from '../models/presenceModel.js';
import Inscription from '../models/inscriptionModel.js';
import Seance from '../models/seanceModel.js';
import User from '../models/userModel.js';
import { sendPushNotification } from './notificationController.js';

// ─────────────────────────────────────────────────────────────
// HELPER: Vérifie si une date est encore modifiable (< 48h)
// ─────────────────────────────────────────────────────────────
const isEditable = (date) => {
    const now = new Date();
    const presenceDate = new Date(date);
    
    // Normaliser presenceDate à minuit LOCAL pour la comparaison
    const presenceStartOfDay = new Date(presenceDate.getFullYear(), presenceDate.getMonth(), presenceDate.getDate());

    // 1. Bloquer si la date est dans le futur (demain ou plus)
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    if (presenceDate.getTime() >= startOfTomorrow.getTime()) {
        console.log(`[Presence] Bloqué: Date dans le futur (${date})`);
        return false;
    }

    // 2. Bloquer si le délai de 48h est dépassé
    // On calcule à partir de MAINTENANT par rapport au début du jour de présence
    const diffMs = now.getTime() - presenceStartOfDay.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    console.log(`[Presence Check] Date: ${date}, DiffHours: ${diffHours.toFixed(2)}h, Now: ${now.toISOString()}`);

    return diffHours <= 48;
};

// @desc    Récupérer les présences d'une séance pour une date donnée
// @route   GET /api/presences?seanceId=...&date=...
// @access  Private (Teacher)
const getPresenceBySeance = asyncHandler(async (req, res) => {
    const { seanceId, date } = req.query;

    if (!seanceId || !date) {
        res.status(400);
        throw new Error('seanceId et date sont requis');
    }

    // Normaliser la date : début et fin du jour sélectionné
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const presences = await Presence.find({
        seance: seanceId,
        date: { $gte: startOfDay, $lte: endOfDay }
    })
        .populate({
            path: 'inscription',
            populate: { path: 'etudiant', select: 'firstName lastName email profileImage' }
        });

    // Vérifier si cette date est encore modifiable
    const editable = isEditable(startOfDay);

    res.status(200).json({
        success: true,
        editable,  // Le frontend utilisera ceci pour activer/désactiver les boutons
        count: presences.length,
        data: presences
    });
});

// @desc    Enregistrer l'appel complet d'une séance (upsert)
// @route   POST /api/presences
// @access  Private (Teacher)
const savePresence = asyncHandler(async (req, res) => {
    const { seanceId, date, presences } = req.body;
    // presences = [{ inscriptionId, statut, remarque }, ...]

    if (!seanceId || !date || !presences || !Array.isArray(presences)) {
        res.status(400);
        throw new Error('seanceId, date et presences (tableau) sont requis');
    }

    // Vérifier si la séance appartient bien à l'enseignant connecté
    const seance = await Seance.findById(seanceId);
    if (!seance) {
        res.status(404);
        throw new Error('Séance non trouvée');
    }
    if (seance.enseignant?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error("Non autorisé : vous n'êtes pas l'enseignant de cette séance");
    }

    // Vérifier la limite 48h
    if (!isEditable(new Date(date))) {
        res.status(403);
        throw new Error('Modification impossible : délai de 48 heures dépassé');
    }

    // Normaliser la date (début de journée)
    const presenceDate = new Date(date);
    presenceDate.setHours(12, 0, 0, 0); // Midi pour éviter les problèmes de fuseau horaire

    // Date objects for start and end of day filter
    const startOfDay = new Date(presenceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(presenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Upsert pour chaque étudiant
    const operations = presences.map(({ inscriptionId, statut, remarque }) => ({
        updateOne: {
            filter: {
                seance: seanceId,
                inscription: inscriptionId,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            },
            update: {
                $set: {
                    seance: seanceId,
                    inscription: inscriptionId,
                    date: presenceDate,
                    statut: statut || 'Present',
                    remarque: remarque || ''
                }
            },
            upsert: true
        }
    }));

    await Presence.bulkWrite(operations);

    // --- ENVOI DES NOTIFICATIONS (ABSENCE & RETARD) ---
    try {
        const inscriptionsToNotifyIds = presences
            .filter(p => p.statut === 'Absent' || p.statut === 'Retard')
            .map(p => p.inscriptionId);

        if (inscriptionsToNotifyIds.length > 0) {
            // Récupérer les étudiants concernés
            const inscriptionsToNotify = await Inscription.find({ _id: { $in: inscriptionsToNotifyIds } })
                .populate('etudiant', 'firstName email _id');
            
            // Tenter de récupérer le nom de la matière pour un message plus précis
            await seance.populate('matiere', 'nomMatiere');
            const matiereName = seance.matiere?.nomMatiere || 'Cours';
            
            // Format de date lisible
            const dateStr = presenceDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            for (const ins of inscriptionsToNotify) {
                if (ins.etudiant) {
                    const studentId = ins.etudiant._id;
                    
                    // Trouver le statut spécifique pour cet étudiant dans la requête originale
                    const pData = presences.find(p => p.inscriptionId.toString() === ins._id.toString());
                    const currentStatut = pData ? pData.statut : 'Absent';

                    let notifTitle = '';
                    let notifBody = '';
                    let notifType = '';

                    if (currentStatut === 'Absent') {
                        notifTitle = 'Nouvelle Absence Enregistrée ❌';
                        notifBody = `Vous avez été marqué absent au cours de ${matiereName} le ${dateStr}. Si c'est une erreur, veuillez contacter l'administration.`;
                        notifType = 'absence';
                    } else if (currentStatut === 'Retard') {
                        notifTitle = 'Retard Enregistré ⚠️';
                        notifBody = `Vous avez été marqué en retard au cours de ${matiereName} le ${dateStr}. Merci de veiller à la ponctualité à l'avenir.`;
                        notifType = 'retard';
                    }

                    if (notifTitle) {
                        // Notification Push / In-App uniquement
                        await sendPushNotification(studentId, {
                            title: notifTitle,
                            body: notifBody,
                            type: notifType,
                            senderId: req.user._id,
                            url: '/presence'
                        }).catch(err => console.error(`Erreur Push ${notifType}:`, err));
                    }
                }
            }
        }

        // ✅ NOTIFICATION POUR L'ADMIN (Cahier de texte validé)
        const admins = await User.find({ role: 'admin' }).select('_id');
        if (admins.length > 0) {
            // Re-populate pour avoir le nom de la matière et de l'enseignant si besoin
            await seance.populate('matiere', 'nomMatiere');
            const teacherName = req.user.firstName + ' ' + req.user.lastName;
            const matiereName = seance.matiere?.nomMatiere || 'Cours';
            const dateStr = presenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

            const adminPromises = admins.map(admin => 
                sendPushNotification(admin._id, {
                    title: 'Enseignant Présent 👨‍🏫',
                    body: `L'enseignant ${teacherName} a été présent aujourd'hui à la séance de ${matiereName} du ${dateStr}.`,
                    type: 'systeme',
                    senderId: req.user._id,
                    url: '/admin/presences'
                })
            );
            await Promise.all(adminPromises);
        }

    } catch (err) {
        console.error('Erreur globale lors de l\'envoi des notifications de présence:', err);
    }
    // -----------------------------------------

    res.status(200).json({
        success: true,
        message: `Appel enregistré pour ${presences.length} étudiant(s)`,
    });
});

// @desc    Récupérer l'historique de présence d'un étudiant
// @route   GET /api/presences/etudiant?inscriptionId=...
// @access  Private (Teacher / Student)
const getPresenceByInscription = asyncHandler(async (req, res) => {
    const { inscriptionId } = req.query;

    if (!inscriptionId) {
        res.status(400);
        throw new Error('inscriptionId est requis');
    }

    const presences = await Presence.find({ inscription: inscriptionId })
        .populate('seance', 'jour heureDebut heureFin matiere')
        .sort({ date: -1 }); // Du plus récent au plus ancien

    // Calculer les statistiques
    const total = presences.length;
    const presents = presences.filter(p => p.statut === 'Present').length;
    const absents = presences.filter(p => p.statut === 'Absent').length;
    const retards = presences.filter(p => p.statut === 'Retard').length;
    const tauxPresence = total > 0 ? Math.round((presents / total) * 100) : 0;

    res.status(200).json({
        success: true,
        stats: { total, presents, absents, retards, tauxPresence },
        data: presences
    });
});

// @desc    Dashboard de présence complet pour un étudiant
// @route   GET /api/presences/etudiant/:etudiantId/stats
// @access  Private (Student / Teacher / Admin)
const getEtudiantPresenceStats = asyncHandler(async (req, res) => {
    const { etudiantId } = req.params;

    // Sécurité : un étudiant ne peut voir que ses propres stats
    if (req.user.role === 'student' && req.user._id.toString() !== etudiantId) {
        res.status(403);
        throw new Error('Accès refusé');
    }

    // 1. Récupérer toutes les inscriptions de cet étudiant (approuvées ou en attente)
    const inscriptions = await Inscription.find({ etudiant: etudiantId, statut: { $in: ['approuvee', 'en_attente'] } })
        .populate('session', 'nomSession duree')
        .populate('classe', 'nomClasse niveau');

    if (!inscriptions.length) {
        return res.status(200).json({
            success: true,
            stats: { total: 0, presents: 0, absents: 0, retards: 0, tauxAssiduité: 0 },
            parSession: [],
            absences: []
        });
    }

    const inscriptionIds = inscriptions.map(i => i._id);

    // 2. Récupérer toutes les présences liées à ces inscriptions
    const allPresences = await Presence.find({ inscription: { $in: inscriptionIds } })
        .populate({
            path: 'seance',
            select: 'jour heureDebut heureFin salle',
            populate: { path: 'matiere', select: 'nomMatiere' }
        })
        .populate({
            path: 'inscription',
            select: 'session classe',
            populate: [
                { path: 'session', select: 'nomSession' },
                { path: 'classe',  select: 'nomClasse niveau' }
            ]
        })
        .sort({ date: -1 });

    // 3. Statistiques globales
    const total   = allPresences.length;
    const presents = allPresences.filter(p => p.statut === 'Present').length;
    const absents  = allPresences.filter(p => p.statut === 'Absent').length;
    const retards  = allPresences.filter(p => p.statut === 'Retard').length;
    // Le taux d'assiduëté compte les présents + retards comme "étant venu"
    const tauxAssiduité = total > 0 ? Math.round(((presents + retards) / total) * 100) : 0;

    // 4. Détail par session
    const sessionMap = {};
    allPresences.forEach(p => {
        const sessionId = p.inscription?.session?._id?.toString() || 'inconnu';
        const sessionName = p.inscription?.session?.nomSession || 'Session inconnue';
        if (!sessionMap[sessionId]) {
            sessionMap[sessionId] = {
                sessionId,
                nomSession: sessionName,
                total: 0, presents: 0, absents: 0, retards: 0, taux: 0
            };
        }
        sessionMap[sessionId].total++;
        if (p.statut === 'Present') sessionMap[sessionId].presents++;
        if (p.statut === 'Absent')  sessionMap[sessionId].absents++;
        if (p.statut === 'Retard')  sessionMap[sessionId].retards++;
    });

    // Calculer le taux par session
    const parSession = Object.values(sessionMap).map(s => ({
        ...s,
        taux: s.total > 0 ? Math.round(((s.presents + s.retards) / s.total) * 100) : 0
    }));

    // 6. Historique complet (pour la grille de présence)
    const history = allPresences.map(p => ({
        _id: p._id,
        date: p.date,
        statut: p.statut,
        remarque: p.remarque,
        seance: {
            jour: p.seance?.jour,
            heureDebut: p.seance?.heureDebut,
            heureFin: p.seance?.heureFin,
            matiere: p.seance?.matiere?.nomMatiere || 'Matière inconnue',
            salle: p.seance?.salle
        },
        session: p.inscription?.session?.nomSession || 'Session inconnue'
    }));

    // 5. Liste spécifique des absences (Legacy support if needed)
    const absences = history.filter(h => h.statut === 'Absent');

    res.status(200).json({
        success: true,
        stats: { total, presents, absents, retards, tauxAssiduité },
        parSession,   // Détail par session
        absences,     // Liste des absences (Legacy)
        history       // Tout l'historique (pour la grille)
    });
});

// @desc    Récupérer les présences de TOUS les étudiants pour l'admin
// @route   GET /api/presences/admin/all
// @access  Private (Admin)
const getAllStudentPresences = asyncHandler(async (req, res) => {
    const { month } = req.query; // YYYY-MM
    let dateFilter = {};

    if (month) {
        const [year, m] = month.split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59, 999);
        dateFilter = { date: { $gte: start, $lte: end } };
    }

    // 1. Get all inscriptions (approved students in classes)
    const inscriptions = await Inscription.find({ statut: 'approuvee' })
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate('classe', 'nomClasse niveau')
        .populate('session', 'nomSession');

    // 2. Get all presence records for the filtered period
    const presences = await Presence.find(month ? dateFilter : {});

    // 3. Group by Student ID
    const studentsMap = {};

    inscriptions.forEach(ins => {
        if (!ins.etudiant) return;
        const studentId = ins.etudiant._id.toString();

        if (!studentsMap[studentId]) {
            studentsMap[studentId] = {
                id: studentId,
                student: {
                    name: `${ins.etudiant.firstName} ${ins.etudiant.lastName}`,
                    email: ins.etudiant.email,
                    avatar: (ins.etudiant.firstName?.[0] || '') + (ins.etudiant.lastName?.[0] || '')
                },
                sessions: [],
                globalStats: { total: 0, presents: 0, absents: 0, retards: 0 }
            };
        }

        const insPresences = presences.filter(p => p.inscription.toString() === ins._id.toString());
        
        const sessionInfo = {
            inscriptionId: ins._id,
            sessionId: ins.session?._id,
            sessionName: ins.session?.nomSession || 'Inconnue',
            className: ins.classe?.nomClasse || 'Inconnue',
            stats: {
                total: insPresences.length,
                presents: insPresences.filter(p => p.statut === 'Present').length,
                absents: insPresences.filter(p => p.statut === 'Absent').length,
                retards: insPresences.filter(p => p.statut === 'Retard').length
            },
            history: insPresences.map(p => ({
                id: p._id,
                date: p.date,
                statut: p.statut,
                remarque: p.remarque
            }))
        };

        studentsMap[studentId].sessions.push(sessionInfo);
        
        // Update global stats for this student
        studentsMap[studentId].globalStats.total += sessionInfo.stats.total;
        studentsMap[studentId].globalStats.presents += sessionInfo.stats.presents;
        studentsMap[studentId].globalStats.absents += sessionInfo.stats.absents;
        studentsMap[studentId].globalStats.retards += sessionInfo.stats.retards;
    });

    const result = Object.values(studentsMap);

    res.status(200).json({
        success: true,
        count: result.length,
        data: result
    });
});

export { 
    getPresenceBySeance, 
    savePresence, 
    getPresenceByInscription, 
    getEtudiantPresenceStats,
    getAllStudentPresences 
};
