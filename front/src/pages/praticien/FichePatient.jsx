import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { appeler } from '@api';
import { useAuth } from '@auth/AuthContext';
import { dateCourte, dateSeule, heure } from '@utils/dateFormat.js';
import Bande from '@components/Bande';
import Carte from '@components/Carte';
import EtapesParcours from '@components/fiche/EtapesParcours';
import InfosFormulaire from '@components/fiche/InfosFormulaire';
import NotesSuivi from '@components/fiche/NotesSuivi';
import Seances from '@components/fiche/Seances';
import Pastille from '@components/Pastille';
import { libelleStatutPatient } from '@components/Statuts';
import Tuile from '@components/Tuile';

const SEXE = { femme: 'Femme', homme: 'Homme', autre: 'Autre' };

export default function FichePatient() {
  const { id } = useParams();
  const { utilisateur } = useAuth();
  const [dossier, setDossier] = useState(null);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(
    () => appeler(`/patients/${id}`).then((d) => { setDossier(d); setErreur(''); }).catch((e) => setErreur(e.message)),
    [id]
  );

  useEffect(() => { charger(); }, [charger]);

  // Exécute une action, recharge le dossier et renvoie true si tout s'est bien passé
  async function agir(action, succes) {
    setOccupe(true);
    setMessage(null);
    try {
      await action();
      await charger();
      setMessage({ type: 'success', texte: succes });
      return true;
    } catch (e) {
      setMessage({ type: 'error', texte: e.message });
      return false;
    } finally {
      setOccupe(false);
    }
  }

  const changerStatut = (idEtape, statut) =>
    agir(() => appeler(`/patients/${id}/etapes/${idEtape}`, { methode: 'PATCH', corps: { statut } }), 'Étape mise à jour.');
  const ajouterNote = (contenu, visiblePatient) =>
    agir(() => appeler(`/patients/${id}/notes`, { methode: 'POST', corps: { contenu, visiblePatient } }), 'Note ajoutée.');
  const planifierSeance = (dateHeure, idEtape) =>
    agir(() => appeler(`/patients/${id}/seances`, { methode: 'POST', corps: { dateHeure, idEtape } }), 'Séance planifiée.');

  if (erreur && !dossier) {
    return (
      <Bande ton="creme">
        <div className="flex flex-col items-start gap-4">
          <div role="alert" className="alert alert-error">{erreur}</div>
          <Link to="/praticien" className="btn btn-neutral">← Retour à la liste des patients</Link>
        </div>
      </Bande>
    );
  }
  if (!dossier) return <Bande ton="creme"><p role="status">Chargement…</p></Bande>;

  const total = dossier.etapes.length;
  const realisees = dossier.etapes.filter((e) => e.statut === 'realisee').length;
  const statut = realisees === 0 ? 'a_demarrer' : realisees === total ? 'termine' : 'en_cours';
  const prochaine = dossier.seancesAVenir[0];

  return (
    <>
      <Bande ton="creme">
        <Link to="/praticien" className="btn btn-sm btn-neutral">← Patients</Link>
        <div className="mt-6">
          <Pastille>{dossier.parcours} · {libelleStatutPatient(statut)}</Pastille>
        </div>
        <h1 className="titre-hero mt-4">{dossier.prenom} <em>{dossier.nom}</em></h1>
        <p className="chapo mt-5 font-texte">
          <span className="font-medium">Objectif :</span> {dossier.objectif ?? 'Non renseigné'}
          {dossier.dateCible && ` (échéance : ${dateSeule(dossier.dateCible)})`}
        </p>
        <p className="mt-2 text-sm opacity-70">
          {SEXE[dossier.sexe]} · {dossier.age} ans · {dossier.email} · {dossier.telephone}
        </p>

        <div className="mt-8 flex flex-wrap gap-5">
          <Tuile ton="orange" valeur={`${realisees}/${total}`} libelle="étapes réalisées" inclinaison={-2} />
          <Tuile ton="vert" valeur={prochaine ? dateCourte(prochaine.dateHeure) : '—'}
            libelle={prochaine ? `prochaine séance · ${heure(prochaine.dateHeure)}` : 'aucune séance prévue'} inclinaison={1.5} />
          <Tuile ton="bleu" valeur={dossier.notes.length} libelle="notes de suivi" inclinaison={-1} />
        </div>

        <div aria-live="polite" className="mt-6 empty:hidden">
          {message && <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.texte}</div>}
        </div>
      </Bande>

      <Bande ton="vert">
        <EtapesParcours etapes={dossier.etapes} editable occupe={occupe} onChangerStatut={changerStatut} />
      </Bande>

      <Bande ton="sable">
        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NotesSuivi notes={dossier.notes} editable occupe={occupe} onAjouter={ajouterNote} />
          </div>
          <div className="flex flex-col gap-8">
            <Carte titre="Praticiens impliqués" variante="sombre">
              <ul className="liste-puces">
                {dossier.praticiens.map((p) => (
                  <li key={p.id}>
                    {p.prenom} {p.nom}{p.id === utilisateur.id && ' (vous)'} <span className="opacity-70">· {p.specialite}</span>
                    <br />
                    <a className="link break-all text-sm" href={`mailto:${p.email}`}>{p.email}</a>
                  </li>
                ))}
              </ul>
            </Carte>
            <Seances aVenir={dossier.seancesAVenir} passees={dossier.seancesPassees} etapes={dossier.etapes}
              editable occupe={occupe} onPlanifier={planifierSeance} />
          </div>
        </div>
      </Bande>

      <Bande ton="bleu">
        <InfosFormulaire questionnaire={dossier.questionnaire} patient={dossier} />
      </Bande>
    </>
  );
}
