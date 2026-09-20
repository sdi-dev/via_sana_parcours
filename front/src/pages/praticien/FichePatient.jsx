import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { appeler } from '../../api';
import { dateSeule } from '../../format';
import EtapesParcours from '../../components/fiche/EtapesParcours';
import InfosFormulaire from '../../components/fiche/InfosFormulaire';
import NotesSuivi from '../../components/fiche/NotesSuivi';
import Seances from '../../components/fiche/Seances';

const SEXE = { femme: 'Femme', homme: 'Homme', autre: 'Autre' };

export default function FichePatient() {
    const { id } = useParams();
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
            <div className="flex flex-col gap-3">
                <div role="alert" className="alert alert-error">{erreur}</div>
                <Link to="/praticien" className="link">← Retour à la liste des patients</Link>
            </div>
        );
    }
    if (!dossier) return <p role="status">Chargement…</p>;

    return (
        <div className="flex flex-col gap-4">
            <Link to="/praticien" className="link w-fit">← Patients</Link>

            <header className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h1 className="text-2xl font-semibold">{dossier.prenom} {dossier.nom}</h1>
                    <p>{SEXE[dossier.sexe]} · {dossier.age} ans · {dossier.parcours}</p>
                    <p><span className="font-medium">Objectif :</span> {dossier.objectif ?? 'Non renseigné'}
                        {dossier.dateCible && ` (échéance : ${dateSeule(dossier.dateCible)})`}</p>
                    <p className="text-sm opacity-70">{dossier.email} · {dossier.telephone}</p>
                </div>
            </header>

            <div aria-live="polite">
                {message && <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.texte}</div>}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <EtapesParcours etapes={dossier.etapes} editable occupe={occupe} onChangerStatut={changerStatut} />
                    <NotesSuivi notes={dossier.notes} editable occupe={occupe} onAjouter={ajouterNote} />
                </div>
                <div className="flex flex-col gap-4">
                    <section className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Praticiens impliqués</h2>
                            <ul>
                                {dossier.praticiens.map((p) => (
                                    <li key={p.id}>{p.prenom} {p.nom} <span className="opacity-70">· {p.specialite}</span></li>
                                ))}
                            </ul>
                        </div>
                    </section>
                    <Seances aVenir={dossier.seancesAVenir} passees={dossier.seancesPassees} etapes={dossier.etapes}
                             editable occupe={occupe} onPlanifier={planifierSeance} />
                </div>
            </div>

            <InfosFormulaire questionnaire={dossier.questionnaire} />
        </div>
    );
}