import asyncHandler from 'express-async-handler';
import Inscription from '../models/inscriptionModel.js';

// @desc    Générer un rapport financier mensuel avec l'IA (Gemini)
// @route   GET /api/ai/rapport-financier
// @access  Private (Admin only)
export const genererRapportFinancier = asyncHandler(async (req, res) => {

    // 1. Récupérer les données financières depuis MongoDB
    const inscriptions = await Inscription.find({ statut: 'approuvee' })
        .populate('etudiant', 'firstName lastName email')
        .populate('session', 'nomSession montant')
        .populate('classe', 'nomClasse');

    if (!inscriptions || inscriptions.length === 0) {
        res.status(404);
        throw new Error('Aucune donnée financière trouvée.');
    }

    // 2. Formater les données pour l'IA
    const totalInscriptions = inscriptions.length;
    const totalAttendu = inscriptions.reduce((sum, i) => sum + (i.session?.montant || 0), 0);
    const totalEncaisse = inscriptions.reduce((sum, i) => sum + (i.montantVerseTotal || 0), 0);
    const totalRestant = Math.max(0, totalAttendu - totalEncaisse);
    const tauxRecouvrement = totalAttendu > 0 ? ((totalEncaisse / totalAttendu) * 100).toFixed(1) : 0;

    const etudiantsPaids = inscriptions.filter(i => i.statutPaiement === 'Payé').length;
    const etudiantsNonPaids = inscriptions.filter(i => i.statutPaiement === 'Non Payé').length;
    const etudiantsAvance = inscriptions.filter(i => i.statutPaiement === 'Avance').length;

    const parSession = {};
    inscriptions.forEach(i => {
        const nomSession = i.session?.nomSession || 'Session Inconnue';
        if (!parSession[nomSession]) {
            parSession[nomSession] = { total: 0, encaisse: 0, etudiants: 0 };
        }
        parSession[nomSession].total += i.session?.montant || 0;
        parSession[nomSession].encaisse += i.montantVerseTotal || 0;
        parSession[nomSession].etudiants += 1;
    });

    // 3. Prompt
    const prompt = `
Tu es un expert comptable pour une association coranique. Analyse :
- Étudiants: ${totalInscriptions}
- Encaissé: ${totalEncaisse.toFixed(3)} TND / Attendu: ${totalAttendu.toFixed(3)} TND
- Reste: ${totalRestant.toFixed(3)} TND (Taux: ${tauxRecouvrement}%)
Génère un rapport professionnel en français avec résumé, analyse et recommandations.
`;

    // 4. Appel API Direct (Plus stable pour ton environnement)
    let rapport;
    try {
        const apiKey = process.env.GEMINI_API_KEY.trim();
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        rapport = data.candidates[0].content.parts[0].text;
    } catch (apiError) {
        console.error("❌ Erreur Gemini:", apiError.message);
        rapport = "## Analyse Indisponible\nL'analyse par Intelligence Artificielle est temporairement indisponible.";
    }

    // 5. Retour
    res.status(200).json({
        success: true,
        donnees: {
            totalInscriptions,
            totalAttendu: parseFloat(totalAttendu.toFixed(3)),
            totalEncaisse: parseFloat(totalEncaisse.toFixed(3)),
            totalRestant: parseFloat(totalRestant.toFixed(3)),
            tauxRecouvrement: parseFloat(tauxRecouvrement),
            etudiantsPaids,
            etudiantsNonPaids,
            etudiantsAvance,
            parSession
        },
        rapport
    });
});
