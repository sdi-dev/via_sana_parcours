// Le statut n'est jamais porté par la couleur seule : symbole + libellé
const ETAPE = {
  realisee: { symbole: '✓', libelle: 'Réalisée', classe: 'statut-realise' },
  en_cours: { symbole: '●', libelle: 'En cours', classe: 'statut-en-cours' },
  a_venir: { symbole: '○', libelle: 'À venir', classe: 'statut-a-venir' },
};

const PATIENT = {
  a_demarrer: { symbole: '○', libelle: 'À démarrer', classe: 'statut-a-venir' },
  en_cours: { symbole: '●', libelle: 'En cours', classe: 'statut-en-cours' },
  termine: { symbole: '✓', libelle: 'Terminé', classe: 'statut-realise' },
};

function Pastille({ definition }) {
  return (
    <span className={`statut ${definition.classe}`}>
      <span aria-hidden="true">{definition.symbole}</span>
      {definition.libelle}
    </span>
  );
}

export const StatutEtape = ({ statut }) => <Pastille definition={ETAPE[statut]} />;
export const StatutPatient = ({ statut }) => <Pastille definition={PATIENT[statut]} />;
export const libelleStatutPatient = (statut) => PATIENT[statut].libelle;
