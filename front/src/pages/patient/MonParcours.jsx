import { Activity, CalendarClock, ListChecks, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appeler } from '@api';
import { dateCourte, dateSeule, heure } from '@utils/dateFormat.js';
import Bande from '@components/Bande';
import Chargement from '@components/Chargement';
import Carte from '@components/Carte';
import EtapesParcours from '@components/fiche/EtapesParcours';
import InfosFormulaire from '@components/fiche/InfosFormulaire';
import NotesSuivi from '@components/fiche/NotesSuivi';
import Seances from '@components/fiche/Seances';
import Pastille from '@components/Pastille';
import Tuile from '@components/Tuile';

export default function MonParcours() {
  const [dossier, setDossier] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appeler('/moi/dossier').then(setDossier).catch((e) => setErreur(e.message));
  }, []);

  if (erreur) return <Bande ton="creme"><div role="alert" className="alert alert-error">{erreur}</div></Bande>;
  if (!dossier) return <Bande ton="creme"><Chargement className="min-h-96" /></Bande>;

  const total = dossier.etapes.length;
  const realisees = dossier.etapes.filter((e) => e.statut === 'realisee').length;
  const prochaine = dossier.seancesAVenir[0];
  const questionnaire = <InfosFormulaire questionnaire={dossier.questionnaire} patient={dossier} vuePatient />;

  return (
    <>
      <Bande ton="creme">
        <Pastille icone={Activity}>Votre suivi · PrépaMarathon</Pastille>
        <h1 className="titre-hero mt-4">Mon <em>parcours</em></h1>
        <p className="chapo mt-5 font-texte">
          Bonjour {dossier.prenom}, voici où vous en êtes dans votre parcours <strong>{dossier.parcours}</strong>.
        </p>
        {dossier.objectif && (
          <p className="chapo mt-2 font-texte">
            <span className="font-medium">Votre objectif :</span> {dossier.objectif}
            {dossier.dateCible && ` (échéance : ${dateSeule(dossier.dateCible)})`}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-5">
          <Tuile ton="orange" valeur={`${realisees}/${total}`} libelle="étapes réalisées" icone={ListChecks} inclinaison={-2} />
          <Tuile ton="vert" valeur={prochaine ? dateCourte(prochaine.dateHeure) : '—'}
            libelle={prochaine ? `prochaine séance · ${heure(prochaine.dateHeure)}` : 'aucune séance prévue'} icone={CalendarClock} inclinaison={1.5} />
          <Tuile ton="bleu" valeur={dossier.praticiens.length} libelle="praticiens dans votre équipe" icone={Users} inclinaison={-1} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <progress className="progress progress-primary w-48" value={realisees} max={total} aria-label="Progression dans le parcours" />
          <span>{realisees} étape{realisees > 1 ? 's' : ''} sur {total} réalisée{realisees > 1 ? 's' : ''}</span>
        </div>
      </Bande>

      {!dossier.questionnaire && <Bande ton="bleu">{questionnaire}</Bande>}

      <Bande ton="vert">
        <EtapesParcours etapes={dossier.etapes} />
      </Bande>

      <Bande ton="sable">
        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NotesSuivi notes={dossier.notes} />
          </div>
          <div className="flex flex-col gap-8">
            <Carte titre="Votre équipe" variante="sombre">
              <ul className="liste-puces">
                {dossier.praticiens.map((p) => (
                  <li key={p.id}>{p.prenom} {p.nom} <span className="opacity-70">· {p.specialite}</span></li>
                ))}
              </ul>
            </Carte>
            <Seances aVenir={dossier.seancesAVenir} passees={dossier.seancesPassees} />
          </div>
        </div>
      </Bande>

      {dossier.questionnaire && <Bande ton="bleu">{questionnaire}</Bande>}
    </>
  );
}
