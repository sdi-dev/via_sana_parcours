import { useState } from 'react';
import { dateSeule } from '@utils/dateFormat.js';
import { INFOS_CLES, QUESTIONS, SECTIONS, URL_EVALANDGO, formaterReponse, pointsAttention } from '../../formulaire';
import Carte from '../Carte';

export default function InfosFormulaire({ questionnaire, patient, vuePatient = false }) {
  const [generation, setGeneration] = useState(false);
  const [erreurPdf, setErreurPdf] = useState('');
  const titre = vuePatient ? 'Votre questionnaire préalable' : 'Questionnaire préalable';

  if (!questionnaire) {
    return (
      <Carte titre={titre}>
        <p>{vuePatient ? "Vous n'avez pas encore rempli votre questionnaire préalable." : "Le questionnaire n'a pas encore été rempli."}</p>
        {vuePatient && (
          <a className="btn btn-primary mt-4" href={URL_EVALANDGO} target="_blank" rel="noreferrer">
            Remplir le questionnaire (s&apos;ouvre dans un nouvel onglet)
          </a>
        )}
      </Carte>
    );
  }

  const { reponses, dateSoumission } = questionnaire;
  const attention = pointsAttention(reponses);

  // Le générateur de PDF (jsPDF) n'est chargé qu'au moment du clic
  async function telecharger() {
    setGeneration(true);
    setErreurPdf('');
    try {
      const { telechargerQuestionnairePdf } = await import('@pdf/questionnairePdf');
      await telechargerQuestionnairePdf({ patient, questionnaire, vuePatient });
    } catch {
      setErreurPdf("Le PDF n'a pas pu être généré. Réessayez dans un instant.");
    } finally {
      setGeneration(false);
    }
  }

  return (
    <Carte titre={titre}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm opacity-70">Rempli le {dateSeule(dateSoumission)}</p>
        <button type="button" className="btn btn-sm btn-neutral" onClick={telecharger} disabled={generation}>
          {generation ? 'Génération du PDF…' : 'Télécharger le questionnaire (PDF)'}
        </button>
      </div>
      {erreurPdf && <div role="alert" className="alert alert-error mb-4">{erreurPdf}</div>}

      {!vuePatient && attention.length > 0 && (
        <div role="note" className="alert alert-warning mb-5">
          <div>
            <p className="font-semibold"><span aria-hidden="true">⚠ </span>Points d&apos;attention</p>
            <ul className="list-disc pl-5">
              {attention.map((p) => <li key={p.cle}>{p.libelle} : {p.valeur}</li>)}
            </ul>
          </div>
        </div>
      )}

      <h3 className="mb-2 text-base">{vuePatient ? 'Vos réponses principales' : 'Informations clés'}</h3>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {INFOS_CLES.map((cle) => (
          <div key={cle}>
            <dt className="text-sm opacity-70">{QUESTIONS[cle].libelle}</dt>
            <dd>{formaterReponse(QUESTIONS[cle], reponses[cle])}</dd>
          </div>
        ))}
      </dl>

      <details className="collapse collapse-arrow mt-6 rounded-2xl bg-base-200">
        <summary className="collapse-title font-medium">Toutes les réponses</summary>
        <div className="collapse-content flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.titre}>
              <h4 className="mb-2 text-sm">{section.titre}</h4>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {section.questions.map((q) => (
                  <div key={q.cle}>
                    <dt className="text-sm opacity-70">{q.libelle}</dt>
                    <dd>{formaterReponse(q, reponses[q.cle])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </details>
    </Carte>
  );
}
