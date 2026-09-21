import { Eye, Lock } from 'lucide-react';
import { useState } from 'react';
import { dateHeure } from '@utils/dateFormat.js';
import Carte from '@components/Carte';

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
    <Carte titre={editable ? 'Notes de suivi' : 'Messages de vos praticiens'}>
      {editable && (
        <form onSubmit={envoyer} className="mb-5 flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span>Nouvelle note</span>
            <textarea className="textarea w-full" rows={3} maxLength={2000} required
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
            <li key={n.id} className="rounded-2xl bg-base-200 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{n.auteurPrenom} {n.auteurNom}</span>
                <span className="opacity-70">· {n.auteurSpecialite} · {dateHeure(n.dateCreation)}</span>
                {editable && (
                  <span className={`badge badge-sm gap-1 ${n.visiblePatient ? 'badge-success' : 'badge-warning'}`}>
                    {n.visiblePatient ? <Eye size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
                    {n.visiblePatient ? 'Partagée avec le patient' : 'Privée'}
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line font-texte text-sm leading-relaxed">{n.contenu}</p>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
