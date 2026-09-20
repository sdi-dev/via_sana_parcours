import { dateSeule } from '../../format';
import { StatutEtape } from '../Statuts';

export default function EtapesParcours({ etapes, editable = false, occupe = false, onChangerStatut }) {
  const uneEnCours = etapes.some((e) => e.statut === 'en_cours');

  return (
    <section className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Parcours</h2>
        <ol className="flex flex-col divide-y divide-base-300">
          {etapes.map((e) => (
            <li key={e.idEtape} className="flex flex-wrap items-center gap-3 py-3">
              <span className="font-medium min-w-6">{e.position}.</span>
              <div className="flex-1 min-w-48">
                <p className="font-medium">{e.libelle}</p>
                <p className="text-sm opacity-70">
                  {e.statut === 'realisee' && e.dateRealisation
                    ? `Réalisée le ${dateSeule(e.dateRealisation)}`
                    : e.specialiteAttendue ?? ' '}
                </p>
              </div>
              <StatutEtape statut={e.statut} />
              {editable && e.statut === 'en_cours' && (
                <button type="button" className="btn btn-sm btn-primary" disabled={occupe}
                  aria-label={`Terminer l'étape ${e.libelle}`}
                  onClick={() => onChangerStatut(e.idEtape, 'realisee')}>
                  Terminer l&apos;étape
                </button>
              )}
              {editable && e.statut === 'a_venir' && !uneEnCours && (
                <button type="button" className="btn btn-sm btn-outline" disabled={occupe}
                  aria-label={`Démarrer l'étape ${e.libelle}`}
                  onClick={() => onChangerStatut(e.idEtape, 'en_cours')}>
                  Démarrer l&apos;étape
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
