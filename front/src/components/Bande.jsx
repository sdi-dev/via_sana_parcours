import { useLayoutEffect, useRef } from 'react';

// Section pleine largeur avec un fond de la palette : creme, sable, bleu ou vert.
// Une section située sous la ligne de flottaison apparaît en douceur quand elle entre à l'écran.
// Le CSS ne masque rien si l'utilisateur demande moins d'animations (ni sans JavaScript).
export default function Bande({ ton = 'creme', className = '', children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const bande = ref.current;
    if (!bande || typeof IntersectionObserver === 'undefined') return;
    // Déjà visible à l'affichage : aucune animation, pour ne pas retarder le contenu principal
    if (bande.getBoundingClientRect().top < window.innerHeight) return;

    bande.dataset.apparition = 'attente';
    const observateur = new IntersectionObserver(([entree]) => {
      if (entree.isIntersecting) {
        bande.dataset.apparition = 'faite';
        observateur.disconnect();
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    observateur.observe(bande);
    return () => observateur.disconnect();
  }, []);

  return (
    <div ref={ref} className={`bande bande-${ton} ${className}`}>
      <div className="conteneur">{children}</div>
    </div>
  );
}
