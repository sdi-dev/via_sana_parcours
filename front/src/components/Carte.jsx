// variante : « blanche » (contour foncé) ou « sombre » (fond vert, ombre orange)
export default function Carte({ titre, variante = 'blanche', className = '', children }) {
  return (
    <section className={`carte ${variante === 'sombre' ? 'carte-sombre' : ''} ${className}`}>
      {titre && <h2 className="titre-carte">{titre}</h2>}
      {children}
    </section>
  );
}
