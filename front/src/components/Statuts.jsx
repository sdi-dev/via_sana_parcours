import { Circle, CircleCheck, CircleDot, CirclePlay } from 'lucide-react';
import { libelleStatutPatient } from '@utils/statuts.js';

// Le statut n'est jamais porté par la couleur seule : icône + libellé
const ETAPE = {
  realisee: { icone: CircleCheck, libelle: 'Réalisée', classe: 'statut-realise' },
  en_cours: { icone: CircleDot, libelle: 'En cours', classe: 'statut-en-cours' },
  a_venir: { icone: Circle, libelle: 'À venir', classe: 'statut-a-venir' },
};

const PATIENT = {
  a_demarrer: { icone: CirclePlay, libelle: libelleStatutPatient('a_demarrer'), classe: 'statut-a-venir' },
  en_cours: { icone: CircleDot, libelle: libelleStatutPatient('en_cours'), classe: 'statut-en-cours' },
  termine: { icone: CircleCheck, libelle: libelleStatutPatient('termine'), classe: 'statut-realise' },
};

function Statut({ definition }) {
  const Icone = definition.icone;
  return (
    <span className={`statut ${definition.classe}`}>
      <span aria-hidden="true" className="inline-flex"><Icone size={14} strokeWidth={2.5} /></span>
      {definition.libelle}
    </span>
  );
}

export const StatutEtape = ({ statut }) => <Statut definition={ETAPE[statut]} />;
export const StatutPatient = ({ statut }) => <Statut definition={PATIENT[statut]} />;
