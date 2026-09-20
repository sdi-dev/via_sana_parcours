import { dateSeule } from '../../format';
import { INFOS_CLES, QUESTIONS, SECTIONS, URL_EVALANDGO, formaterReponse, pointsAttention } from '../../formulaire';

export default function InfosFormulaire({ questionnaire, vuePatient = false }) {
  const titre = vuePatient ? 'Votre questionnaire préalable' : 'Questionnaire préalable';

  if (!questionnaire) {
    return (
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{titre}</h2>
            <p>{vuePatient ? "Vous n'avez pas encore rempli votre questionnaire préalable." : "Le questionnaire n'a pas encore été rempli."}</p>
            {vuePatient && (
                <a className="btn btn-primary w-fit" href={URL_EVALANDGO} target="_blank" rel="noreferrer">
                  Remplir le questionnaire (s&apos;ouvre dans un nouvel onglet)
                </a>
            )}
          </div>
        </section>
    );
  }

  const { reponses, dateSoumission } = questionnaire;
  const attention = pointsAttention(reponses);

  return (
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">{titre}</h2>
          <p className="text-sm opacity-70">Rempli le {dateSeule(dateSoumission)}</p>

          {!vuePatient && attention.length > 0 && (
              <div role="note" className="alert alert-warning">
                <div>
                  <p className="font-semibold"><span aria-hidden="true">⚠ </span>Points d&apos;attention</p>
                  <ul className="list-disc pl-5">
                    {attention.map((p) => <li key={p.cle}>{p.libelle} : {p.valeur}</li>)}
                  </ul>
                </div>
              </div>
          )}

          <h3 className="font-semibold">{vuePatient ? 'Vos réponses principales' : 'Informations clés'}</h3>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {INFOS_CLES.map((cle) => (
                <div key={cle}>
                  <dt className="text-sm opacity-70">{QUESTIONS[cle].libelle}</dt>
                  <dd>{formaterReponse(QUESTIONS[cle], reponses[cle])}</dd>
                </div>
            ))}
          </dl>

          <details className="collapse collapse-arrow bg-base-200">
            <summary className="collapse-title font-medium">Toutes les réponses</summary>
            <div className="collapse-content flex flex-col gap-4">
              {SECTIONS.map((section) => (
                  <div key={section.titre}>
                    <h4 className="font-semibold mb-1">{section.titre}</h4>
                    <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
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
        </div>
      </section>
  );
}