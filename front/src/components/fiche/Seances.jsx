import { useState } from 'react';
import { dateHeure } from '../../format';

const STATUT_SEANCE = { prevue: 'Prévue', realisee: 'Réalisée', annulee: 'Annulée' };

function Ligne({ seance }) {
  return (
    <li className="py-2">
      <p className="font-medium">{dateHeure(seance.dateHeure)}</p>
      <p className="text-sm opacity-70">
        {seance.praticienPrenom} {seance.praticienNom} · {seance.praticienSpecialite}
        {seance.etape ? ` · ${seance.etape}` : ''}
      </p>
    </li>
  );
}

export default function Seances({ aVenir, passees, etapes = [], editable = false, occupe = false, onPlanifier }) {
  const [dateHeureSaisie, setDateHeureSaisie] = useState('');
  const [idEtape, setIdEtape] = useState('');

  async function envoyer(e) {
    e.preventDefault();
    const iso = new Date(dateHeureSaisie).toISOString();
    if (await onPlanifier(iso, idEtape ? Number(idEtape) : null)) {
      setDateHeureSaisie('');
      setIdEtape('');
    }
  }

  return (
    <section className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Séances</h2>

        <h3 className="font-semibold">Prochaines séances</h3>
        {aVenir.length === 0 ? (
          <p className="opacity-70">Aucune séance prévue.</p>
        ) : (
          <ul className="divide-y divide-base-300">{aVenir.map((s) => <Ligne key={s.id} seance={s} />)}</ul>
        )}

        {editable && (
          <form onSubmit={envoyer} className="flex flex-col gap-2 rounded-box bg-base-200 p-3">
            <label className="flex flex-col gap-1">
              <span>Date et heure</span>
              <input type="datetime-local" className="input input-bordered w-full" required
                value={dateHeureSaisie} onChange={(e) => setDateHeureSaisie(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span>Étape concernée (facultatif)</span>
              <select className="select select-bordered w-full" value={idEtape} onChange={(e) => setIdEtape(e.target.value)}>
                <option value="">Aucune</option>
                {etapes.map((e) => <option key={e.idEtape} value={e.idEtape}>{e.position}. {e.libelle}</option>)}
              </select>
            </label>
            <button type="submit" className="btn btn-outline w-fit" disabled={occupe || !dateHeureSaisie}>
              Planifier la séance
            </button>
          </form>
        )}

        {passees.length > 0 && (
          <>
            <h3 className="font-semibold mt-2">Historique</h3>
            <ul className="divide-y divide-base-300">
              {passees.map((s) => (
                <li key={s.id} className="py-2">
                  <p className="font-medium">{dateHeure(s.dateHeure)} <span className="badge badge-ghost badge-sm ml-1">{STATUT_SEANCE[s.statut]}</span></p>
                  <p className="text-sm opacity-70">
                    {s.praticienPrenom} {s.praticienNom} · {s.praticienSpecialite}{s.etape ? ` · ${s.etape}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
