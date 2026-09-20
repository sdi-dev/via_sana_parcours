import { dateSeule } from '@utils/dateFormat';
import { SECTIONS, formaterReponse, pointsAttention } from '../formulaire';

const VERT = [30, 55, 50];
const ORANGE = [236, 110, 72];
const CREME = [247, 241, 232];
const SABLE = [239, 230, 216];
const NOIR = [38, 38, 38];
const GRIS = [95, 95, 95];

const MARGE = 18;
const LARGEUR = 210;
const HAUTEUR = 297;
const COLONNE_LIBELLE = 74;
const BAS_DE_PAGE = HAUTEUR - 22;

// Les polices PDF standard ne connaissent pas les guillemets typographiques
const nettoyer = (texte) => String(texte)
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u00A0\u202F]/g, ' ');

const slug = (texte) => texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function dessinerEntete(doc) {
  doc.setFillColor(...VERT);
  doc.rect(0, 0, LARGEUR, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...CREME);
  doc.text('PRÉPA', MARGE, 17);
  doc.setTextColor(...ORANGE);
  doc.text('MARATHON', MARGE + doc.getTextWidth('PRÉPA'), 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CREME);
  doc.text('Suivi de parcours · Via Sana', LARGEUR - MARGE, 17, { align: 'right' });
}

export async function construirePdf({ patient, questionnaire, vuePatient = false }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const nomComplet = `${patient.prenom} ${patient.nom}`;

  doc.setProperties({
    title: `Questionnaire préalable - ${nomComplet}`,
    subject: 'Questionnaire préalable PrépaMarathon',
    author: 'Via Sana - PrépaMarathon',
  });
  doc.setLanguage('fr-FR');

  dessinerEntete(doc);

  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NOIR);
  doc.text('Questionnaire préalable', MARGE, y);
  doc.setFillColor(...ORANGE);
  doc.rect(MARGE, y + 3, 32, 1.4, 'F');

  y += 14;
  doc.setFontSize(13);
  doc.text(nettoyer(nomComplet), MARGE, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(`Rempli le ${dateSeule(questionnaire.dateSoumission)}`, MARGE, y);
  y += 4.5;
  doc.text(`Document généré le ${dateSeule(new Date().toISOString())}`, MARGE, y);
  y += 10;

  // Points d'attention : réservés aux praticiens
  const attention = vuePatient ? [] : pointsAttention(questionnaire.reponses);
  if (attention.length > 0) {
    const lignes = attention.flatMap((p) => doc.splitTextToSize(`- ${nettoyer(p.libelle)} : ${nettoyer(p.valeur)}`, LARGEUR - 2 * MARGE - 8));
    const hauteur = 12 + lignes.length * 4.6;
    doc.setFillColor(...ORANGE);
    doc.roundedRect(MARGE, y, LARGEUR - 2 * MARGE, hauteur, 3, 3, 'F');
    doc.setTextColor(...NOIR);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("POINTS D'ATTENTION", MARGE + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(lignes, MARGE + 4, y + 13);
    y += hauteur + 8;
  }

  for (const section of SECTIONS) {
    if (y > BAS_DE_PAGE - 30) { doc.addPage(); y = 22; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...VERT);
    doc.text(nettoyer(section.titre).toUpperCase(), MARGE, y);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.5);
    doc.line(MARGE, y + 2, LARGEUR - MARGE, y + 2);
    y += 9;

    for (const q of section.questions) {
      const libelle = doc.setFont('helvetica', 'normal').setFontSize(8.5).splitTextToSize(nettoyer(q.libelle), COLONNE_LIBELLE - 4);
      const reponse = doc.setFont('helvetica', 'bold').setFontSize(9.5).splitTextToSize(nettoyer(formaterReponse(q, questionnaire.reponses[q.cle])), LARGEUR - 2 * MARGE - COLONNE_LIBELLE);
      const hauteur = Math.max(libelle.length * 4, reponse.length * 4.4) + 3.2;

      if (y + hauteur > BAS_DE_PAGE) { doc.addPage(); y = 22; }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRIS);
      doc.text(libelle, MARGE, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...NOIR);
      doc.text(reponse, MARGE + COLONNE_LIBELLE, y);

      y += hauteur;
      doc.setDrawColor(...SABLE);
      doc.setLineWidth(0.25);
      doc.line(MARGE, y - 1.8, LARGEUR - MARGE, y - 1.8);
    }
    y += 6;
  }

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setDrawColor(...SABLE);
    doc.setLineWidth(0.25);
    doc.line(MARGE, HAUTEUR - 14, LARGEUR - MARGE, HAUTEUR - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text('Via Sana - PrépaMarathon · prototype de démonstration, données fictives', MARGE, HAUTEUR - 9);
    doc.text(`Page ${page} / ${total}`, LARGEUR - MARGE, HAUTEUR - 9, { align: 'right' });
  }

  return { doc, nomFichier: `questionnaire-${slug(patient.prenom)}-${slug(patient.nom)}.pdf` };
}

export async function telechargerQuestionnairePdf(options) {
  const { doc, nomFichier } = await construirePdf(options);
  doc.save(nomFichier);
}
