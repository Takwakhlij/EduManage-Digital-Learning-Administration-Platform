import cron from 'node-cron';
import Inscription from '../models/inscriptionModel.js';
import User from '../models/userModel.js';
import { sendPushNotification } from '../controllers/notificationController.js';

// ─────────────────────────────────────────────────────────────────────────────
// RELANCE AUTOMATIQUE — Chaque Lundi à 08h00
// Cron pattern : '0 8 * * 1'
//   0   → minute 0
//   8   → heure 8h
//   *   → tous les jours du mois
//   *   → tous les mois
//   1   → Lundi (0=Dimanche, 1=Lundi ... 6=Samedi)
// ─────────────────────────────────────────────────────────────────────────────

const startRelanceJob = () => {
    cron.schedule('0 8 * * 1', async () => {
        console.log('\n⏰ [CRON RELANCE] Démarrage de la relance automatique...');

        try {
            // 1. Récupérer tous les débiteurs (Approuvés + Non entièrement payés)
            const debiteurs = await Inscription.find({
                statut: 'approuvee',
                statutPaiement: { $in: ['Non Payé', 'Avance'] },
            })
                .populate('etudiant', 'firstName lastName _id')
                .populate('session', 'nomSession montant');

            if (debiteurs.length === 0) {
                console.log('✅ [CRON RELANCE] Aucun débiteur trouvé. Aucun rappel envoyé.');
                return;
            }

            console.log(`📋 [CRON RELANCE] ${debiteurs.length} débiteur(s) trouvé(s). Envoi des rappels...`);

            let successCount = 0;
            let errorCount = 0;

            for (const inscription of debiteurs) {
                try {
                    if (!inscription.etudiant || !inscription.session) continue;

                    const studentName = `${inscription.etudiant.firstName} ${inscription.etudiant.lastName}`;
                    const sessionName = inscription.session.nomSession || 'la session';
                    const resteAPayer = inscription.resteAPayer?.toFixed(2) || '?';

                    const studentPayload = {
                        title: '⚠️ Rappel de Paiement',
                        body: `Bonjour ${inscription.etudiant.firstName}, un solde de ${resteAPayer} TND reste dû pour la session "${sessionName}". Veuillez régulariser votre situation.`,
                        type: 'paiement',
                        senderId: null,
                        url: '/mes-inscriptions',
                        relatedId: inscription._id,
                    };

                    // Notifier l'ÉTUDIANT
                    await sendPushNotification(inscription.etudiant._id, studentPayload);

                    // Notifier les PARENTS
                    const parents = await User.find({
                        children: inscription.etudiant._id,
                        role: 'parent',
                    }).select('_id');

                    for (const parent of parents) {
                        await sendPushNotification(parent._id, {
                            ...studentPayload,
                            title: '⚠️ Rappel de Paiement — Votre enfant',
                            body: `Un solde de ${resteAPayer} TND reste dû pour ${studentName} (session "${sessionName}"). Veuillez régulariser votre situation.`,
                        });
                    }

                    console.log(`   ✔ Rappel envoyé → ${studentName} (${resteAPayer} TND restant)`);
                    successCount++;
                } catch (innerErr) {
                    console.error(`   ✘ Erreur pour inscription ${inscription._id}:`, innerErr.message);
                    errorCount++;
                }
            }

            console.log(`\n✅ [CRON RELANCE] Terminé. Succès: ${successCount} | Échecs: ${errorCount}\n`);
        } catch (err) {
            console.error('❌ [CRON RELANCE] Erreur globale:', err);
        }
    }, {
        scheduled: true,
        timezone: 'Africa/Tunis', // Fuseau horaire Tunisie (UTC+1)
    });

    console.log('🔔 [CRON] Job de relance automatique activé — Chaque Lundi à 08h00 (Tunis)');
};

export default startRelanceJob;
