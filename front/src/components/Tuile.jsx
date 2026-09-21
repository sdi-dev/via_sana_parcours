// Tuile de chiffre inclinée ; devient un bouton (filtre) si onClick est fourni
export default function Tuile({ ton = 'orange', valeur, libelle, inclinaison = -2, onClick, actif = false, icone: Icone }) {
  const classe = `tuile tuile-${ton}`;
  const style = { '--rot': `${inclinaison}deg` };
  const contenu = (
    <>
      <span className="tuile-valeur">{valeur}</span>
      <span className="tuile-libelle inline-flex items-center gap-1.5">
        {Icone && <Icone size={14} aria-hidden="true" />}
        {libelle}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={classe} style={style} aria-pressed={actif} aria-label={`${valeur} ${libelle}`} onClick={onClick}>
        {contenu}
      </button>
    );
  }
  return <div className={classe} style={style}>{contenu}</div>;
}
