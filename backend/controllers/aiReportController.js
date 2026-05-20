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

    // 3. Prompt Structuré 
    const prompt = `
Tu es un expert comptable certifié spécialisé dans la gestion des associations.
Analyse les données financières suivantes de l'association coranique :

DONNÉES CLÉS :
- Nombre total d'étudiants inscrits : ${totalInscriptions}
- Total des montants attendus (Chiffre d'affaires théorique) : ${totalAttendu.toFixed(3)} TND
- Total effectivement encaissé : ${totalEncaisse.toFixed(3)} TND
- Reste à percevoir (Dette étudiante) : ${totalRestant.toFixed(3)} TND
- Taux de recouvrement actuel : ${tauxRecouvrement}%

DÉTAILS DES PAIEMENTS :
- Paiements complets : ${etudiantsPaids} étudiants
- Paiements partiels (Avances) : ${etudiantsAvance} étudiants
- Non payés : ${etudiantsNonPaids} étudiants

MISSION :
Génère un rapport financier professionnel et stratégique en français. Le rapport doit être structuré comme suit :
1. RÉSUMÉ EXÉCUTIF : Une vue d'ensemble de la situation financière actuelle.
2. ANALYSE DES ÉCARTS : Analyse détaillée du manque à gagner et des retards de paiement.
3. IDENTIFICATION DES RISQUES : Quels sont les risques pour la trésorerie de l'association ?
4. RECOMMANDATIONS STRATÉGIQUES : Propose 3 à 5 actions concrètes pour améliorer le recouvrement et optimiser la gestion financière
(ex: relances, remises pour paiement anticipé, etc.).

Utilise un style professionnel, encourageant et expert.
`;
    // 4. Appel API Direct
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
