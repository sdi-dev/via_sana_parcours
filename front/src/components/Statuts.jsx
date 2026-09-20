// Le statut n'est jamais porté par la couleur seule : symbole + libellé
const ETAPE = {
  realisee: { symbole: '✓', libelle: 'Réalisée', classe: 'badge-success' },
  en_cours: { symbole: '●', libelle: 'En cours', classe: 'badge-warning' },
  a_venir: { symbole: '○', libelle: 'À venir', classe: 'badge-ghost' },
};

const PATIENT = {
  a_demarrer: { symbole: '○', libelle: 'À démarrer', classe: 'badge-ghost' },
  en_cours: { symbole: '●', libelle: 'En cours', classe: 'badge-warning' },
  termine: { symbole: '✓', libelle: 'Terminé', classe: 'badge-success' },
};

function Badge({ definition }) {
  return (
    <span className={`badge gap-1 whitespace-nowrap ${definition.classe}`}>
      <span aria-hidden="true">{definition.symbole}</span>
      {definition.libelle}
    </span>
  );
}

export const StatutEtape = ({ statut }) => <Badge definition={ETAPE[statut]} />;
export const StatutPatient = ({ statut }) => <Badge definition={PATIENT[statut]} />;
