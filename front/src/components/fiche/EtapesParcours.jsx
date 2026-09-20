import { dateSeule } from '@utils/dateFormat.js';
import { StatutEtape } from '@components/Statuts';

// À placer dans une bande verte : cartes numérotées, avec actions si editable
export default function EtapesParcours({ etapes, editable = false, occupe = false, onChangerStatut }) {
  const uneEnCours = etapes.some((e) => e.statut === 'en_cours');

  return (
    <section aria-labelledby="titre-parcours">
      <h2 id="titre-parcours" className="titre-section mb-8">Le <em>parcours</em></h2>
      <ol className="grille-etapes">
        {etapes.map((e, i) => (
          <li key={e.idEtape} className={`etape-carte ${e.statut === 'en_cours' ? 'etape-active' : ''}`}
            style={{ '--rot': `${i % 2 === 0 ? -0.8 : 0.8}deg` }}>
            <span className="numero-contour" aria-hidden="true">{String(e.position).padStart(2, '0')}</span>
            <h3 className="titre-etape">{e.libelle}</h3>
            <p className="texte-etape">
              {e.statut === 'realisee' && e.dateRealisation
                ? `Réalisée le ${dateSeule(e.dateRealisation)}`
                : e.specialiteAttendue ?? ''}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              <StatutEtape statut={e.statut} />
              {editable && e.statut === 'en_cours' && (
                <button type="button" className="btn btn-sm btn-primary" disabled={occupe}
                  aria-label={`Terminer l'étape ${e.libelle}`}
                  onClick={() => onChangerStatut(e.idEtape, 'realisee')}>
                  Terminer l&apos;étape
                </button>
              )}
              {editable && e.statut === 'a_venir' && !uneEnCours && (
                <button type="button" className="btn btn-sm btn-accent" disabled={occupe}
                  aria-label={`Démarrer l'étape ${e.libelle}`}
                  onClick={() => onChangerStatut(e.idEtape, 'en_cours')}>
                  Démarrer l&apos;étape
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
