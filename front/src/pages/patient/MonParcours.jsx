import { useEffect, useState } from 'react';
import { appeler } from '../../api';
import { dateHeure, dateSeule } from '../../format';
import EtapesParcours from '../../components/fiche/EtapesParcours';
import InfosFormulaire from '../../components/fiche/InfosFormulaire';
import NotesSuivi from '../../components/fiche/NotesSuivi';
import Seances from '../../components/fiche/Seances';

export default function MonParcours() {
  const [dossier, setDossier] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appeler('/moi/dossier').then(setDossier).catch((e) => setErreur(e.message));
  }, []);

  if (erreur) return <div role="alert" className="alert alert-error">{erreur}</div>;
  if (!dossier) return <p role="status">Chargement…</p>;

  const total = dossier.etapes.length;
  const realisees = dossier.etapes.filter((e) => e.statut === 'realisee').length;
  const prochaine = dossier.seancesAVenir[0];
  const questionnaire = <InfosFormulaire questionnaire={dossier.questionnaire} vuePatient />;

  return (
      <div className="flex flex-col gap-4">
        <header className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h1 className="text-2xl font-semibold">Mon parcours</h1>
            <p className="font-texte">Bonjour {dossier.prenom}, voici où vous en êtes dans votre parcours <strong>{dossier.parcours}</strong>.</p>
            {dossier.objectif && (
                <p className="font-texte">
                  <span className="font-medium">Votre objectif :</span> {dossier.objectif}
                  {dossier.dateCible && ` (échéance : ${dateSeule(dossier.dateCible)})`}
                </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <progress className="progress progress-primary w-48" value={realisees} max={total} aria-label="Progression dans le parcours" />
              <span>{realisees} étape{realisees > 1 ? 's' : ''} sur {total} réalisée{realisees > 1 ? 's' : ''}</span>
            </div>
          </div>
        </header>

        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Prochaine séance</h2>
            {prochaine ? (
                <p>
                  <span className="font-medium">{dateHeure(prochaine.dateHeure)}</span>
                  <br />
                  avec {prochaine.praticienPrenom} {prochaine.praticienNom} ({prochaine.praticienSpecialite})
                  {prochaine.etape && ` · ${prochaine.etape}`}
                </p>
            ) : (
                <p>Aucune séance n&apos;est prévue pour le moment.</p>
            )}
          </div>
        </section>

        {!dossier.questionnaire && questionnaire}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <EtapesParcours etapes={dossier.etapes} />
            <NotesSuivi notes={dossier.notes} />
          </div>
          <div className="flex flex-col gap-4">
            <section className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Votre équipe</h2>
                <ul>
                  {dossier.praticiens.map((p) => (
                      <li key={p.id}>{p.prenom} {p.nom} <span className="opacity-70">· {p.specialite}</span></li>
                  ))}
                </ul>
              </div>
            </section>
            <Seances aVenir={dossier.seancesAVenir} passees={dossier.seancesPassees} />
          </div>
        </div>

        {dossier.questionnaire && questionnaire}
      </div>
  );
}