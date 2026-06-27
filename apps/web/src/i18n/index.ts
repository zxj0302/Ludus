import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh-CN';
import en from './en';
import { lightsOutI18n, nimI18n, wythoffI18n, sudokuI18n, sokobanI18n } from '@ludus/games';

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': {
      translation: {
        ...zhCN.translation,
        ...lightsOutI18n.zhCN,
        ...nimI18n.zhCN,
        ...wythoffI18n.zhCN,
        ...sudokuI18n.zhCN,
        ...sokobanI18n.zhCN,
      },
    },
    en: {
      translation: {
        ...en.translation,
        ...lightsOutI18n.en,
        ...nimI18n.en,
        ...wythoffI18n.en,
        ...sudokuI18n.en,
        ...sokobanI18n.en,
      },
    },
  },
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
