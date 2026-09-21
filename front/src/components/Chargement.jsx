import { useEffect, useState } from 'react';

// Écran d'attente : logo qui pulse et barre qui défile.
// Au bout de quelques secondes, prévient que l'hébergement gratuit est en train de se réveiller.
export default function Chargement({ className = '', plein = false }) {
  const [long, setLong] = useState(false);

  useEffect(() => {
    const minuteur = setTimeout(() => setLong(true), 4000);
    return () => clearTimeout(minuteur);
  }, []);

  return (
    <div role="status" className={`chargement ${plein ? 'min-h-screen bg-base-200' : ''} ${className}`}>
      <p className="logo chargement-logo" aria-hidden="true">Prépa<span>Marathon</span></p>
      <span className="chargement-barre" aria-hidden="true" />
      <p>Chargement…</p>
      {long && <p className="text-sm opacity-80">Le serveur se réveille, cela peut prendre une minute.</p>}
    </div>
  );
}
