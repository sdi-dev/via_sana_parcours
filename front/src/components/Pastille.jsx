// Petite étiquette en capitales ; « icone » (composant lucide) est facultative et décorative
export default function Pastille({ ton = 'bleu', icone: Icone, children }) {
  const classe = ton === 'sombre' ? 'pastille-sombre' : ton === 'orange' ? 'pastille-orange' : '';
  return (
    <span className={`pastille ${classe}`}>
      {Icone && <Icone size={14} strokeWidth={2.25} aria-hidden="true" />}
      {children}
    </span>
  );
}
