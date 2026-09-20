import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { appeler } from '../../api';
import { dateHeure } from '../../format';
import { StatutPatient } from '../../components/Statuts';

const FILTRES_VIDES = { statut: '', etape: '', parcours: '' };

export default function ListePatients() {
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [parcours, setParcours] = useState([]);
  const [patients, setPatients] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appeler('/parcours').then(setParcours).catch((e) => setErreur(e.message));
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
  const parcoursChoisi = parcours.find((p) => String(p.id) === filtres.parcours);
  const etapes = (parcoursChoisi ? [parcoursChoisi] : parcours).flatMap((p) => p.etapes);
  const filtresActifs = saisie || Object.values(filtres).some(Boolean);

  return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Patients</h1>

        <form className="flex flex-wrap items-end gap-3" role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Rechercher un patient</span>
            <input type="search" className="input input-bordered" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
          </label>
          {parcours.length > 1 && (
              <label className="flex flex-col gap-1">
                <span className="text-sm">Parcours</span>
                <select className="select select-bordered" value={filtres.parcours} onChange={modifier('parcours')}>
                  <option value="">Tous</option>
                  {parcours.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Statut</span>
            <select className="select select-bordered" value={filtres.statut} onChange={modifier('statut')}>
              <option value="">Tous</option>
              <option value="a_demarrer">À démarrer</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Étape en cours</span>
            <select className="select select-bordered" value={filtres.etape} onChange={modifier('etape')}>
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

        {erreur && <div role="alert" className="alert alert-error">{erreur}</div>}

        {patients === null && !erreur && <p role="status">Chargement…</p>}

        {patients && (
            <>
              <p aria-live="polite" className="text-sm opacity-70">
                {patients.length} patient{patients.length > 1 ? 's' : ''}
              </p>
              {patients.length === 0 ? (
                  <p>Aucun patient ne correspond à ces critères.</p>
              ) : (
                  <div className="overflow-x-auto rounded-box bg-base-100 shadow-sm">
                    <table className="table">
                      <caption className="sr-only">Liste des patients</caption>
                      <thead>
                      <tr>
                        <th scope="col">Patient</th>
                        <th scope="col">Étape en cours</th>
                        <th scope="col">Statut</th>
                        <th scope="col">Progression</th>
                        <th scope="col">Prochaine séance</th>
                      </tr>
                      </thead>
                      <tbody>
                      {patients.map((p) => (
                          <tr key={p.id} className="hover hover:bg-base-200">
                            <td>
                              <Link to={`/praticien/patients/${p.id}`} className="link link-hover font-medium">
                                {p.prenom} {p.nom}
                              </Link>
                              <div className="text-sm opacity-70">{p.objectif}</div>
                            </td>
                            <td>{p.etapeEnCours ?? '—'}</td>
                            <td><StatutPatient statut={p.statut} /></td>
                            <td>
                              <div className="flex items-center gap-2">
                                <progress className="progress progress-primary w-20" value={p.etapesRealisees} max={p.etapesTotal}
                                          aria-label={`Progression de ${p.prenom} ${p.nom}`} />
                                <span className="text-sm whitespace-nowrap">{p.etapesRealisees}/{p.etapesTotal} étapes</span>
                              </div>
                            </td>
                            <td>{p.prochaineSeance ? dateHeure(p.prochaineSeance) : '—'}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </>
        )}
      </div>
  );
}