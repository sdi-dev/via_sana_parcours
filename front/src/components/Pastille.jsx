export default function Pastille({ ton = 'bleu', children }) {
  const classe = ton === 'sombre' ? 'pastille-sombre' : ton === 'orange' ? 'pastille-orange' : '';
  return <span className={`pastille ${classe}`}>{children}</span>;
}
