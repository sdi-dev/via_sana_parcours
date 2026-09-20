import { useState } from 'react';
import { dateHeure } from '../../format';

export default function NotesSuivi({ notes, editable = false, occupe = false, onAjouter }) {
    const [contenu, setContenu] = useState('');
    const [visible, setVisible] = useState(false);

    async function envoyer(e) {
        e.preventDefault();
        if (await onAjouter(contenu, visible)) {
            setContenu('');
            setVisible(false);
        }
    }

    return (
        <section className="card bg-base-100 shadow-sm">
            <div className="card-body">
                <h2 className="card-title">{editable ? 'Notes de suivi' : 'Messages de vos praticiens'}</h2>

                {editable && (
                    <form onSubmit={envoyer} className="flex flex-col gap-2">
                        <label className="flex flex-col gap-1">
                            <span>Nouvelle note</span>
                            <textarea className="textarea textarea-bordered w-full" rows={3} maxLength={2000} required
                                      value={contenu} onChange={(e) => setContenu(e.target.value)} />
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" className="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                            <span>Visible par le patient</span>
                        </label>
                        <button type="submit" className="btn btn-primary w-fit" disabled={occupe || !contenu.trim()}>
                            Ajouter la note
                        </button>
                    </form>
                )}

                {notes.length === 0 ? (
                    <p className="opacity-70">{editable ? 'Aucune note pour le moment.' : 'Aucun message pour le moment.'}</p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {notes.map((n) => (
                            <li key={n.id} className="rounded-box bg-base-200 p-3">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="font-medium">{n.auteurPrenom} {n.auteurNom}</span>
                                    <span className="opacity-70">· {n.auteurSpecialite} · {dateHeure(n.dateCreation)}</span>
                                    {editable && (
                                        <span className="badge badge-outline badge-sm">
                      {n.visiblePatient ? 'Partagée avec le patient' : 'Privée'}
                    </span>
                                    )}
                                </div>
                                <p className="mt-1 whitespace-pre-line font-texte">{n.contenu}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}