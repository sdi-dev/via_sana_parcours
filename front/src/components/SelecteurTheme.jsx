import { useState } from 'react';
import { THEMES, appliquerTheme, themeInitial } from '../theme';

export default function SelecteurTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || themeInitial());

  function changer(e) {
    setTheme(e.target.value);
    appliquerTheme(e.target.value);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>Thème</span>
      <select className="select select-sm" value={theme} onChange={changer}>
        {THEMES.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
      </select>
    </label>
  );
}
