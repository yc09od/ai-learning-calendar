import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lang, T, getT } from './i18n';

const LANG_KEY = 'diary-lang';

interface LangCtx {
  lang: Lang;
  t: T;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangCtx>({
  lang: 'zh',
  t: getT('zh'),
  setLang: () => {},
});

export function useLang(): LangCtx {
  return useContext(LangContext);
}

function detectDeviceLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith('fr')) return 'fr';
    if (locale.startsWith('zh')) return 'zh';
  } catch {}
  return 'en';
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectDeviceLang);

  // Override with saved preference (if any) after mount
  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved === 'zh' || saved === 'en' || saved === 'fr') {
        setLangState(saved as Lang);
      }
    });
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l);
  }

  return (
    <LangContext.Provider value={{ lang, t: getT(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}
