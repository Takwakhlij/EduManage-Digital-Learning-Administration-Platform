import asyncHandler from 'express-async-handler';
import TeacherPresence from '../models/teacherPresenceModel.js';
import Presence from '../models/presenceModel.js';
import Inscription from '../models/inscriptionModel.js';
import Seance from '../models/seanceModel.js';

// @desc    Créer ou mettre à jour la présence (Cahier de texte) d'un enseignant
// @route   POST /api/teacher-presences
// @access  Private (Teacher)
const saveTeacherPresence = asyncHandler(async (req, res) => {
    const { seanceId, date, cahierTexte, statut, remarqueAdmin } = req.body;

    if (!seanceId || !date) {
        res.status(400);
        throw new Error('Séance et date sont requises');
    }

    const seance = await Seance.findById(seanceId);
    if (!seance) {
        res.status(404);
        throw new Error('Séance non trouvée');
    }

    if (seance.enseignant?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error("Non autorisé : vous n'êtes pas l'enseignant de cette séance");
    }

    const presenceDate = new Date(date);
    presenceDate.setHours(12, 0, 0, 0);
    
    const startOfDay = new Date(presenceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(presenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const targetTeacherId = seance.enseignant || req.user._id;

    let tp = await TeacherPresence.findOne({
        enseignant: targetTeacherId,
        seance: seanceId,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (tp) {
        if (cahierTexte !== undefined) tp.cahierTexte = cahierTexte;
        if (statut) tp.statut = statut;
        if (remarqueAdmin !== undefined && req.user.role === 'admin') tp.remarqueAdmin = remarqueAdmin;
        await tp.save();
    } else {
        tp = await TeacherPresence.create({
            enseignant: targetTeacherId,
            seance: seanceId,
            date: presenceDate,
            cahierTexte: cahierTexte || '',
            statut: statut || 'Present',
            remarqueAdmin: req.user.role === 'admin' ? (remarqueAdmin || '') : ''
        });
    }

    res.status(200).json({ success: true, data: tp });
});

// @desc    Récupérer le cahier de texte pour une séance et date
// @route   GET /api/teacher-presences?seanceId=...&date=...
// @access  Private (Teacher)
const getTeacherPresenceBySeance = asyncHandler(async (req, res) => {
    const { seanceId, date } = req.query;

    if (!seanceId || !date) {
        res.status(400);
        throw new Error('seanceId et date sont requis');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tp = await TeacherPresence.findOne({
        seance: seanceId,
        date: { $gte: startOfDay, $lte: endOfDay },
        enseignant: req.user._id
    });

    res.status(200).json({ success: true, data: tp });
});

// Helper function to map French days to JS Date getDay()
const getDayIndex = (jour) => {
    const map = { 'Dimanche': 0, 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6 };
    return map[jour];
};

// @desc    Récupérer toutes les présences enseignants groupées avec prévisions (Cahiers de texte)
// @route   GET /api/teacher-presences/all
// @access  Private (Admin)
// @desc    Récupérer toutes les présences enseignants groupées par ENSEIGNANT (Vue Drill-down)
// @route   GET /api/teacher-presences/all
// @access  Private (Admin)
const getAllTeacherPresences = asyncHandler(async (req, res) => {
    // 1. Déterminer le mois cible
    let year = new Date().getFullYear();
    let monthIndex = new Date().getMonth(); // 0-based
    
    const monthQuery = req.query.month || req.query.date;
    if (monthQuery) {
        const parts = monthQuery.split('-');
        if(parts.length >= 2) {
            year = parseInt(parts[0], 10);
            monthIndex = parseInt(parts[1], 10) - 1;
        }
    }

    const startOfMonth = new Date(year, monthIndex, 1);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    const today = new Date();
    today.setHours(0,0,0,0);

    const monthNameFr = startOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const formattedMonth = monthNameFr.charAt(0).toUpperCase() + monthNameFr.slice(1);

    // 2. Fetch all scheduled Seances with teachers
    const allSeances = await Seance.find({ enseignant: { $exists: true, $ne: null } })
        .populate('enseignant', 'firstName lastName email profileImage')
        .populate('matiere', 'nom nomMatiere')
        .populate('classe', 'nom nomClasse')
        .populate('session', 'nomSession'); // Added session population

    // 3. Fetch all TeacherPresences submitted within this month
    const presences = await TeacherPresence.find({
        date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const teacherMap = {};

    // 4. Process each scheduled Seance
    for (const seance of allSeances) {
        const teacher = seance.enseignant;
        if (!teacher) continue;
        
        const teacherId = teacher._id.toString();
        
        if (!teacherMap[teacherId]) {
            const teacherFullName = (teacher.firstName && teacher.lastName) ? `${teacher.firstName} ${teacher.lastName}` : (teacher.firstName || teacher.lastName || 'Inconnu');
            const teacherInitial = teacherFullName.charAt(0).toUpperCase();

            teacherMap[teacherId] = {
                id: teacherId,
                teacher: { _id: teacherId, name: teacherFullName, email: teacher.email, avatar: teacherInitial },
                month: formattedMonth,
                globalStats: { completed: 0, total: 0 },
                groups: {} // Keyed by Class+Subject ID/Name
            };
        }

        const teacherEntry = teacherMap[teacherId];
        const matiereName = seance.matiere?.nomMatiere || seance.matiere?.nom || 'Matière';
        const classeName = seance.classe?.nomClasse || seance.classe?.nom || 'Classe';
        const sessionName = seance.session?.nomSession || 'Session';
        const sessionId = seance.session?._id?.toString() || 'all';

        const groupKey = `${classeName}_${matiereName}`;

        if (!teacherEntry.groups[groupKey]) {
            teacherEntry.groups[groupKey] = {
                id: groupKey,
                subject: matiereName,
                classe: classeName,
                sessionId,
                sessionName,
                stats: { completed: 0, total: 0 },
                seances: []
            };
        }

        const group = teacherEntry.groups[groupKey];
        const dayIdx = getDayIndex(seance.jour);
        
        // Find all dates in the current month matching this weekday
        let d = new Date(year, monthIndex, 1);
        while (d.getMonth() === monthIndex) {
            if (d.getDay() === dayIdx) {
                group.stats.total++; 
                teacherEntry.globalStats.total++;

                const specificDateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const foundPresence = presences.find(p => {
                    if(!p.date) return false;
                    const pDate = new Date(p.date);
                    const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth()+1).padStart(2,'0')}-${String(pDate.getDate()).padStart(2,'0')}`;
                    return p.seance?.toString() === seance._id.toString() && pDateStr === specificDateStr;
                });

                let status = 'pending';
                if (foundPresence) {
                    status = foundPresence.statut ? foundPresence.statut.toLowerCase() : 'present';
                    if (status === 'present') {
                        group.stats.completed++;
                        teacherEntry.globalStats.completed++;
                    }
                } else if (d < today) {
                    status = 'absent';
                }

                // Get student statistics
                const startOfDay = new Date(d);
                startOfDay.setHours(0,0,0,0);
                const endOfDay = new Date(d);
                endOfDay.setHours(23,59,59,999);

                const totalInscriptions = await Inscription.countDocuments({ classe: seance.classe?._id, statut: 'approuvee' });
                const studentPresencesCount = await Presence.countDocuments({
                    seance: seance._id,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    statut: 'Present'
                });

                group.seances.push({
                    id: foundPresence ? foundPresence._id : `missing-${seance._id}-${specificDateStr}`,
                    seanceId: seance._id,
                    date: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
                    rawDate: new Date(d),
                    time: `${seance.heureDebut} - ${seance.heureFin}`,
                    status,
                    textLog: foundPresence ? foundPresence.cahierTexte : '',
                    remarqueAdmin: foundPresence ? foundPresence.remarqueAdmin : '',
                    studentStats: {
                        total: totalInscriptions,
                        present: studentPresencesCount
                    }
                });
            }
            d.setDate(d.getDate() + 1); 
        }
    }

    // 5. Convert to array and sort
    const result = Object.values(teacherMap).map(teacher => {
        teacher.groups = Object.values(teacher.groups).map(g => {
            g.seances.sort((a, b) => b.rawDate - a.rawDate);
            return g;
        });
        return teacher;
    });

    res.status(200).json({ success: true, data: result });
});

// @desc    Get comprehensive attendance for all sessions (Teacher + Students)
// @route   GET /api/teacher-presences/admin/global
// @access  Private (Admin)
const getGlobalSessionsPresence = asyncHandler(async (req, res) => {
    const { month } = req.query; // YYYY-MM
    let dateFilter = {};

    if (month) {
        const [year, m] = month.split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59, 999);
        dateFilter = { date: { $gte: start, $lte: end } };
    }

    // 1. Get all teacher presences
    const teacherPresences = await TeacherPresence.find(month ? dateFilter : {})
        .populate('enseignant', 'firstName lastName email profileImage')
        .populate({
            path: 'seance',
            populate: [
                { path: 'classe', select: 'nomClasse niveau' },
                { path: 'matiere', select: 'nomMatiere' },
                { path: 'session', select: 'nomSession' }
            ]
        })
        .sort({ date: -1 });

    // 2. Enhance with student attendance for each matched session
    const enrichedResults = await Promise.all(teacherPresences.map(async (tp) => {
        if (!tp.seance) return { ...tp._doc, studentStats: { total: 0, present: 0 } };

        const startOfDay = new Date(tp.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(tp.date);
        endOfDay.setHours(23, 59, 59, 999);

        // All potential students (inscriptions) for this session's class
        const totalStudents = await Inscription.countDocuments({ 
            classe: tp.seance.classe?._id,
            statut: 'approuvee' 
        });

        // Actual presences recorded for this date/session
        const studentPresences = await Presence.find({
            seance: tp.seance._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        const presentCount = studentPresences.filter(p => p.statut === 'Present').length;

        return {
            ...tp._doc,
            studentStats: {
                total: totalStudents,
                present: presentCount,
                absent: totalStudents - presentCount
            }
        };
    }));

    res.status(200).json({
        success: true,
        count: enrichedResults.length,
        data: enrichedResults
    });
});

export { saveTeacherPresence, getTeacherPresenceBySeance, getAllTeacherPresences, getGlobalSessionsPresence };
