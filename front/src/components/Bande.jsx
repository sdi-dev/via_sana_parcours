// Section pleine largeur avec un fond de la palette : creme, sable, bleu ou vert
export default function Bande({ ton = 'creme', className = '', children }) {
  return (
    <div className={`bande bande-${ton} ${className}`}>
      <div className="conteneur">{children}</div>
    </div>
  );
}
