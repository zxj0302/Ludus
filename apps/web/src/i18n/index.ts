import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh-CN';
import en from './en';
import { getAllEntries } from '@ludus/games';

const resources: Record<string, { translation: Record<string, string> }> = {
  'zh-CN': { translation: { ...zhCN.translation } },
  en: { translation: { ...en.translation } },
};

for (const entry of getAllEntries()) {
  const zh = resources['zh-CN']!;
  const enLoc = resources.en!;
  Object.assign(zh.translation, entry.i18n.zhCN);
  Object.assign(enLoc.translation, entry.i18n.en);
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
