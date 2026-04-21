import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generates an enhanced PDF receipt for a payment.
 * @param {Object} paiement - The payment object from DB
 * @param {Object} student - The student user object
 * @param {Object} session - The session object
 * @param {Object} inscription - The inscription object (for financial totals)
 * @returns {Promise<string>} - The relative URL of the generated PDF
 */
export const generateReceiptPDF = (paiement, student, session, inscription) => {
    return new Promise((resolve, reject) => {
        try {
            const receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
            const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
            const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'arial.ttf');
            const arabicFontPath = path.join(process.cwd(), 'assets', 'fonts', 'arabtype.ttf');
            
            // Ensure directory exists
            if (!fs.existsSync(receiptsDir)) {
                fs.mkdirSync(receiptsDir, { recursive: true });
            }

            const fileName = `recu_${student.firstName}_${student.lastName}_${paiement._id}.pdf`.replace(/\s+/g, '_');
            const filePath = path.join(receiptsDir, fileName);
            const relativeUrl = `/uploads/receipts/${fileName}`;

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(fs.createWriteStream(filePath));

            // Register Fonts
            doc.registerFont('MainFont', fontPath);
            doc.registerFont('ArabicFont', arabicFontPath);

            // --- Header: Logo & Association Info ---
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 45, { width: 60 });
            }

            doc.fillColor('#10b981') // Emerald Green
               .font('MainFont')
               .fontSize(18)
               .text('ASSOCIATION NOOR TAYYIBA', 120, 50);
            
            doc.fillColor('#64748b') // Muted Gray
               .fontSize(9)
               .text('Enseignement Coranique & Support Pédagogique', 120, 70)
               .text('Tunisie | Email: association.noortayyiba@gmail.com', 120, 82);

            doc.moveDown(2);

            // --- Receipt Title & Date ---
            doc.fillColor('#1e293b') // Dark Slate
               .fontSize(22)
               .font('MainFont')
               .text('REÇU DE PAIEMENT', { align: 'right' });
            
            doc.fontSize(9)
               .text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
            doc.text(`ID Transaction: ${paiement._id}`, { align: 'right' });

            // Horizontal Line
            doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#e2e8f0').stroke();

            doc.moveDown(3);

            // --- Student Info Section ---
            doc.fillColor('#1e293b').fontSize(11).font('MainFont');
            doc.text(`ÉLÈVE :`, 50, 160);
            doc.font('MainFont').text(`${student.firstName} ${student.lastName}`, 130, 160);

            doc.text(`EMAIL :`, 50, 180);
            doc.font('MainFont').text(student.email, 130, 180);

            doc.text(`SESSION :`, 50, 200);
            // Use Arabic font for the session name to avoid garbled text
            doc.font('ArabicFont').fontSize(14).text(session.nomSession || 'Formation Générale', 130, 198);

            doc.moveDown(2);

            // --- Current Payment Details Table ---
            const tableTop = 240;
            doc.font('MainFont').fontSize(10).fillColor('#ffffff');
            
            // Table Header Background
            doc.rect(50, tableTop, 500, 25).fill('#10b981');
            doc.text('DÉSIGNATION', 60, tableTop + 8);
            doc.text('DATE', 250, tableTop + 8);
            doc.text('MODE', 380, tableTop + 8);
            doc.text('MONTANT', 480, tableTop + 8);

            // Table Row
            doc.fillColor('#1e293b').font('MainFont');
            const rowY = tableTop + 35;
            doc.font('ArabicFont').fontSize(12).text(`Versement - ${session.nomSession || 'Formation'}`, 60, rowY - 2);
            doc.font('MainFont').fontSize(10);
            doc.text(new Date(paiement.datePaiement).toLocaleDateString('fr-FR'), 250, rowY);
            doc.text(paiement.modePaiement, 380, rowY);
            doc.font('MainFont').text(`${paiement.montant.toFixed(3)} TND`, 480, rowY);

            // Line below row
            doc.moveTo(50, rowY + 20).lineTo(550, rowY + 20).strokeColor('#f1f5f9').stroke();

            // --- Financial Status Summary ---
            doc.moveDown(4);
            const summaryY = doc.y;
            
            doc.rect(300, summaryY, 250, 100).fill('#f8fafc');
            doc.fillColor('#475569').fontSize(10).font('MainFont');
            
            const statsX = 315;
            const valueX = 450;

            doc.text('TARIF TOTAL SESSION:', statsX, summaryY + 15);
            doc.text(`${session.montant?.toFixed(3) || '0.000'} TND`, valueX, summaryY + 15);

            doc.text('TOTAL DÉJÀ PAYÉ:', statsX, summaryY + 40);
            doc.text(`${inscription.montantVerseTotal?.toFixed(3) || '0.000'} TND`, valueX, summaryY + 40);

            doc.moveTo(statsX, summaryY + 60).lineTo(535, summaryY + 60).strokeColor('#cbd5e1').stroke();

            doc.fillColor('#10b981').font('MainFont').fontSize(12);
            doc.text('RESTE À PAYER:', statsX, summaryY + 75);
            doc.text(`${inscription.resteAPayer?.toFixed(3) || '0.000'} TND`, valueX, summaryY + 75);

            // --- Footer: Association Signature ---
            const footerY = 620; // Moved up from 650
            doc.fillColor('#1e293b').fontSize(11).font('MainFont');
            doc.text("L'Administration", 400, footerY);
            
            doc.fillColor('#10b981').fontSize(14).font('ArabicFont');
            doc.text("Association Noor Tayyiba", 380, footerY + 20);
            
            doc.fontSize(8).fillColor('#94a3b8').font('MainFont').text(
                "Ce document est une preuve de transaction officielle certifiée par l'Association Noor Tayyiba.",
                50, 710, { align: 'center', width: 500 } // Moved up from 750
            );

            doc.end();

            resolve(relativeUrl);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generates a comprehensive PDF history report for multiple payments.
 * @param {Array} paiements - Array of payment objects
 * @param {Object} student - The student user object
 * @param {Object} session - The session object
 * @param {Object} inscription - The inscription object (for current financial totals)
 * @returns {Promise<string>} - The relative URL of the generated PDF
 */
export const generateHistoryPDF = (paiements, student, session, inscription) => {
    return new Promise((resolve, reject) => {
        try {
            const reportsDir = path.join(process.cwd(), 'uploads', 'receipts');
            const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
            const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'arial.ttf');
            const arabicFontPath = path.join(process.cwd(), 'assets', 'fonts', 'arabtype.ttf');

            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const fileName = `historique_${student.firstName}_${student.lastName}_${inscription._id}.pdf`.replace(/\s+/g, '_');
            const filePath = path.join(reportsDir, fileName);
            const relativeUrl = `/uploads/receipts/${fileName}`;

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(fs.createWriteStream(filePath));

            doc.registerFont('MainFont', fontPath);
            doc.registerFont('ArabicFont', arabicFontPath);

            // --- Header ---
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 45, { width: 50 });
            }

            doc.fillColor('#10b981').font('MainFont').fontSize(16).text('ASSOCIATION NOOR TAYYIBA', 110, 50);
            doc.fillColor('#64748b').fontSize(8).text('Historique Complet des Versements', 110, 68);

            doc.fillColor('#1e293b').fontSize(20).font('MainFont').text('RELEVÉ DE PAIEMENTS', { align: 'right' });
            doc.fontSize(8).text(`Émis le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });

            doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e2e8f0').stroke();

            // --- Info ---
            doc.moveDown(2);
            doc.fillColor('#1e293b').fontSize(10).font('MainFont');
            doc.text(`ÉLÈVE: ${student.firstName} ${student.lastName}`, 50, 130);
            doc.text(`EMAIL: ${student.email}`, 50, 145);
            doc.text('FORMATION/SESSION:', 50, 160);
            doc.font('ArabicFont').fontSize(12).text(session.nomSession || 'Formation Générale', 160, 158);

            // --- Table Header ---
            const tableTop = 200;
            doc.font('MainFont').fontSize(9).fillColor('#ffffff');
            doc.rect(50, tableTop, 500, 20).fill('#10b981');
            doc.text('DATE', 60, tableTop + 6);
            doc.text('DESCRIPTION', 150, tableTop + 6);
            doc.text('MODE', 380, tableTop + 6);
            doc.text('MONTANT', 480, tableTop + 6);

            // --- Table Rows ---
            let currentY = tableTop + 25;
            doc.fillColor('#1e293b').font('MainFont').fontSize(9);

            paiements.forEach((p, index) => {
                doc.text(new Date(p.datePaiement).toLocaleDateString('fr-FR'), 60, currentY);
                
                const currentSessionName = p.session?.nomSession || session.nomSession || 'Formation';
                doc.font('ArabicFont').fontSize(10).text(`Versement - ${currentSessionName}`, 150, currentY - 2);
                
                doc.font('MainFont').fontSize(9).text(p.modePaiement === 'Stripe' ? 'En ligne' : (p.modePaiement || 'Espèces'), 380, currentY);
                doc.text(`${p.montant.toFixed(3)} TND`, 480, currentY);
                
                doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).strokeColor('#f1f5f9').stroke();
                currentY += 25;

                // Simple page break logic if rows exceed page
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
            });

            // --- Summary ---
            currentY += 15;
            if (currentY > 750) { doc.addPage(); currentY = 50; }

            doc.rect(300, currentY, 250, 80).fill('#f8fafc');
            doc.fillColor('#475569').fontSize(9).font('MainFont');
            
            doc.text('TARIF TOTAL:', 315, currentY + 15);
            doc.text(`${session.montant?.toFixed(3) || '0.000'} TND`, 450, currentY + 15);

            doc.text('TOTAL PAYÉ:', 315, currentY + 35);
            doc.text(`${inscription.montantVerseTotal?.toFixed(3) || '0.000'} TND`, 450, currentY + 35);

            doc.fillColor('#10b981').font('MainFont').fontSize(11);
            doc.text('RESTE À PAYER:', 315, currentY + 60);
            doc.text(`${inscription.resteAPayer?.toFixed(3) || '0.000'} TND`, 450, currentY + 60);

            // --- Footer ---
            const footerY = 680; // Moved up from 720
            doc.fillColor('#1e293b').fontSize(10).font('MainFont').text("L'Administration", 420, footerY);
            doc.fillColor('#10b981').fontSize(12).font('ArabicFont').text("Association Noor Tayyiba", 400, footerY + 18);
            
            doc.end();
            resolve(relativeUrl);
        } catch (error) {
            reject(error);
        }
    });
};
