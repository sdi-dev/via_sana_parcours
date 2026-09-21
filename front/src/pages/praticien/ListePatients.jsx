import { CalendarClock, CircleCheck, CircleDot, CirclePlay, Flag, ListChecks, Stethoscope, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { appeler } from '@api';
import { dateHeure } from '@utils/dateFormat.js';
import AnnuairePraticiens from '@components/AnnuairePraticiens';
import Bande from '@components/Bande';
import Chargement from '@components/Chargement';
import Carte from '@components/Carte';
import Pastille from '@components/Pastille';
import { StatutPatient } from '@components/Statuts';
import Tuile from '@components/Tuile';

const FILTRES_VIDES = { statut: '', etape: '', parcours: '' };

export default function ListePatients() {
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [parcours, setParcours] = useState([]);
  const [tous, setTous] = useState(null);
  const [patients, setPatients] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appeler('/parcours').then(setParcours).catch((e) => setErreur(e.message));
    appeler('/patients').then(setTous).catch((e) => setErreur(e.message));
  }, []);

  // La recherche n'interroge l'API qu'après une courte pause de frappe
  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie.trim()), 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (recherche) params.set('q', recherche);
    for (const [cle, valeur] of Object.entries(filtres)) if (valeur) params.set(cle, valeur);

    let annule = false;
    appeler(`/patients?${params}`)
      .then((donnees) => { if (!annule) { setPatients(donnees); setErreur(''); } })
      .catch((e) => { if (!annule) setErreur(e.message); });
    return () => { annule = true; };
  }, [recherche, filtres]);

  const modifier = (cle) => (e) => setFiltres((f) => ({ ...f, [cle]: e.target.value, ...(cle === 'parcours' ? { etape: '' } : {}) }));
  const filtrerStatut = (statut) => setFiltres((f) => ({ ...f, statut: f.statut === statut ? '' : statut }));
  const compte = (statut) => (tous ? tous.filter((p) => p.statut === statut).length : '–');

  const parcoursChoisi = parcours.find((p) => String(p.id) === filtres.parcours);
  const etapes = (parcoursChoisi ? [parcoursChoisi] : parcours).flatMap((p) => p.etapes);
  const filtresActifs = saisie || Object.values(filtres).some(Boolean);

  return (
    <>
      <Bande ton="creme">
        <Pastille icone={Stethoscope}>Espace praticien</Pastille>
        <h1 className="titre-hero mt-4">Suivi des <em>patients</em></h1>
        <p className="chapo mt-5 font-texte">
          Un dossier unique par patient : étapes du parcours, séances, notes de suivi et questionnaire préalable.
        </p>
        <div className="mt-8 flex flex-wrap gap-5">
          <Tuile ton="blanche" valeur={tous ? tous.length : '–'} libelle="patients suivis" icone={Users} inclinaison={-2}
            onClick={() => setFiltres((f) => ({ ...f, statut: '' }))} actif={filtres.statut === ''} />
          <Tuile ton="bleu" valeur={compte('a_demarrer')} libelle="à démarrer" icone={CirclePlay} inclinaison={1.5}
            onClick={() => filtrerStatut('a_demarrer')} actif={filtres.statut === 'a_demarrer'} />
          <Tuile ton="orange" valeur={compte('en_cours')} libelle="en cours" icone={CircleDot} inclinaison={-1}
            onClick={() => filtrerStatut('en_cours')} actif={filtres.statut === 'en_cours'} />
          <Tuile ton="vert" valeur={compte('termine')} libelle="terminés" icone={CircleCheck} inclinaison={2}
            onClick={() => filtrerStatut('termine')} actif={filtres.statut === 'termine'} />
        </div>
      </Bande>

      <Bande ton="sable">
        <Carte>
          <form className="mb-6 flex flex-wrap items-end gap-3" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Rechercher un patient</span>
              <input type="search" className="input" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
            </label>
            {parcours.length > 1 && (
              <label className="flex flex-col gap-1">
                <span className="text-sm">Parcours</span>
                <select className="select" value={filtres.parcours} onChange={modifier('parcours')}>
                  <option value="">Tous</option>
                  {parcours.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm">Statut</span>
              <select className="select" value={filtres.statut} onChange={modifier('statut')}>
                <option value="">Tous</option>
                <option value="a_demarrer">À démarrer</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Étape en cours</span>
              <select className="select" value={filtres.etape} onChange={modifier('etape')}>
                <option value="">Toutes</option>
                {etapes.map((e) => <option key={e.id} value={e.id}>{e.position}. {e.libelle}</option>)}
              </select>
            </label>
            {filtresActifs && (
              <button type="button" className="btn btn-ghost" onClick={() => { setSaisie(''); setFiltres(FILTRES_VIDES); }}>
                Réinitialiser
              </button>
            )}
          </form>

          {erreur && <div role="alert" className="alert alert-error mb-4">{erreur}</div>}
          {patients === null && !erreur && <Chargement className="min-h-96" />}

          {patients && (
            <>
              <p aria-live="polite" className="text-sm opacity-70">
                {patients.length} patient{patients.length > 1 ? 's' : ''}
              </p>
              <p className="mb-3 text-sm">Cliquez sur une ligne pour ouvrir la fiche du patient.</p>
              {patients.length === 0 ? (
                <p>Aucun patient ne correspond à ces critères.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-empile table-clic" role="table">
                    <caption className="sr-only">Liste des patients</caption>
                    <thead role="rowgroup">
                      <tr role="row">
                        <th scope="col" role="columnheader">Patient</th>
                        <th scope="col" role="columnheader">Étape en cours</th>
                        <th scope="col" role="columnheader">Statut</th>
                        <th scope="col" role="columnheader">Progression</th>
                        <th scope="col" role="columnheader">Prochaine séance</th>
                        <th scope="col" role="columnheader"><span className="sr-only">Ouvrir la fiche</span></th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {patients.map((p) => (
                        <tr key={p.id} role="row" className="hover:bg-base-200">
                          <td role="cell">
                            <Link to={`/praticien/patients/${p.id}`} className="link lien-ligne font-medium">
                              {p.prenom} {p.nom}
                            </Link>
                            <div className="text-sm opacity-70">{p.objectif}</div>
                          </td>
                          <td role="cell" data-label="Étape en cours">
                            <span className="inline-flex items-center gap-1.5">
                              {p.etapeEnCours && <Flag size={14} aria-hidden="true" />}
                              {p.etapeEnCours ?? '—'}
                            </span>
                          </td>
                          <td role="cell" data-label="Statut"><StatutPatient statut={p.statut} /></td>
                          <td role="cell" data-label="Progression">
                            <div className="flex items-center gap-2">
                              <progress className="progress progress-primary w-20" value={p.etapesRealisees} max={p.etapesTotal}
                                aria-label={`Progression de ${p.prenom} ${p.nom}`} />
                              <span className="badge badge-neutral badge-sm gap-1 whitespace-nowrap">
                                <ListChecks size={12} aria-hidden="true" />
                                {p.etapesRealisees}/{p.etapesTotal} étapes
                              </span>
                            </div>
                          </td>
                          <td role="cell" data-label="Prochaine séance">
                            <span className="inline-flex items-center gap-1.5">
                              {p.prochaineSeance && <CalendarClock size={14} aria-hidden="true" />}
                              {p.prochaineSeance ? dateHeure(p.prochaineSeance) : '—'}
                            </span>
                          </td>
                          <td role="cell" aria-hidden="true" className="cellule-fleche"><span className="fleche-ligne">Ouvrir →</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Carte>
      </Bande>

      <Bande ton="bleu">
        <AnnuairePraticiens />
      </Bande>
    </>
  );
}
