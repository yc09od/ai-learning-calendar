export type Lang = 'zh' | 'en' | 'fr';

export interface T {
  appTitle: string;
  navCalendar: string;
  navAllEntries: string;
  navSettings: string;
  weekdays: string[];
  monthLabel: (year: number, month: number) => string; // month is 0-indexed
  dateLabel: (date: Date) => string;
  locale: string;
  addMood: string;
  moodTitle: (mood: string) => string;
  clearMood: string;
  cancel: string;
  delete: string;
  confirmDeleteMessage: string;
  settings: string;
  version: string;
  language: string;
  thisMonthDiary: string;
  perPage: string;
  allBtn: string;
  pageOf: (page: number, total: number) => string;
  collapse: string;
  expand: string;
  backToCalendar: string;
  writeStory: string;
  save: string;
  noEntriesToday: string;
  edit: string;
  cancelEsc: string;
  allYears: string;
  allMonths: string;
  clearFilter: string;
  current: string;
  totalEntries: (n: number) => string;
  noEntries: string;
  yearOption: (year: number) => string;
  monthOption: (month: number) => string; // month is 1-indexed
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

const zh: T = {
  appTitle: '我的日记本',
  navCalendar: '日历',
  navAllEntries: '所有日记',
  navSettings: '设置',
  weekdays: WEEKDAYS_ZH,
  monthLabel: (y, m) => `${y}年${m + 1}月`,
  dateLabel: (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS_ZH[d.getDay()]}`,
  locale: 'zh-CN',
  addMood: '添加心情',
  moodTitle: (m) => `心情：${m}（点击更改）`,
  clearMood: '× 清除心情',
  cancel: '取消',
  delete: '删除',
  confirmDeleteMessage: '确认删除这篇日记？',
  settings: '设置',
  version: '版本',
  language: '语言',
  thisMonthDiary: '本月日记',
  perPage: '每页',
  allBtn: '全部',
  pageOf: (p, t) => `第 ${p} / ${t} 页`,
  collapse: '收起 ▲',
  expand: '展开 ▼',
  backToCalendar: '← 返回日历',
  writeStory: '写下这一天的故事...',
  save: '保存 (Ctrl+Enter)',
  noEntriesToday: '今天还没有日记，写下第一篇吧！',
  edit: '编辑',
  cancelEsc: '取消 (Esc)',
  allYears: '所有年份',
  allMonths: '所有月份',
  clearFilter: '清除',
  current: '当前',
  totalEntries: (n) => `共 ${n} 篇`,
  noEntries: '暂无日记',
  yearOption: (y) => `${y}年`,
  monthOption: (m) => `${m}月`,
};

const en: T = {
  appTitle: 'My Diary',
  navCalendar: 'Calendar',
  navAllEntries: 'All Entries',
  navSettings: 'Settings',
  weekdays: WEEKDAYS_EN,
  monthLabel: (y, m) => `${MONTHS_EN[m]} ${y}`,
  dateLabel: (d) => `${WEEKDAYS_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
  locale: 'en-US',
  addMood: 'Add Mood',
  moodTitle: (m) => `Mood: ${m} (click to change)`,
  clearMood: '× Clear Mood',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmDeleteMessage: 'Delete this entry?',
  settings: 'Settings',
  version: 'Version',
  language: 'Language',
  thisMonthDiary: 'This Month',
  perPage: 'Per page',
  allBtn: 'All',
  pageOf: (p, t) => `Page ${p} of ${t}`,
  collapse: 'Less ▲',
  expand: 'More ▼',
  backToCalendar: '← Back to Calendar',
  writeStory: 'Write your story for today...',
  save: 'Save (Ctrl+Enter)',
  noEntriesToday: 'No entries today. Write your first one!',
  edit: 'Edit',
  cancelEsc: 'Cancel (Esc)',
  allYears: 'All Years',
  allMonths: 'All Months',
  clearFilter: 'Clear',
  current: 'Current',
  totalEntries: (n) => `${n} entr${n === 1 ? 'y' : 'ies'}`,
  noEntries: 'No entries',
  yearOption: (y) => `${y}`,
  monthOption: (m) => MONTHS_EN[m - 1],
};

const fr: T = {
  appTitle: 'Mon Journal',
  navCalendar: 'Calendrier',
  navAllEntries: 'Toutes les entrées',
  navSettings: 'Paramètres',
  weekdays: WEEKDAYS_FR,
  monthLabel: (y, m) => `${MONTHS_FR[m]} ${y}`,
  dateLabel: (d) => `${WEEKDAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
  locale: 'fr-FR',
  addMood: 'Ajouter une humeur',
  moodTitle: (m) => `Humeur : ${m} (cliquer pour changer)`,
  clearMood: "× Effacer l'humeur",
  cancel: 'Annuler',
  delete: 'Supprimer',
  confirmDeleteMessage: 'Supprimer cette entrée ?',
  settings: 'Paramètres',
  version: 'Version',
  language: 'Langue',
  thisMonthDiary: 'Ce mois-ci',
  perPage: 'Par page',
  allBtn: 'Tout',
  pageOf: (p, t) => `Page ${p} sur ${t}`,
  collapse: 'Réduire ▲',
  expand: 'Développer ▼',
  backToCalendar: '← Retour au calendrier',
  writeStory: "Écrivez votre histoire du jour...",
  save: 'Enregistrer (Ctrl+Entrée)',
  noEntriesToday: "Aucune entrée aujourd'hui. Écrivez la première !",
  edit: 'Modifier',
  cancelEsc: 'Annuler (Échap)',
  allYears: 'Toutes les années',
  allMonths: 'Tous les mois',
  clearFilter: 'Effacer',
  current: 'Actuel',
  totalEntries: (n) => `${n} entrée${n > 1 ? 's' : ''}`,
  noEntries: 'Aucune entrée',
  yearOption: (y) => `${y}`,
  monthOption: (m) => MONTHS_FR[m - 1],
};

const translations: Record<Lang, T> = { zh, en, fr };

export function getT(lang: Lang): T {
  return translations[lang] ?? zh;
}

export function detectLang(): Lang {
  const saved = localStorage.getItem('diary-lang') as Lang | null;
  if (saved && saved in translations) return saved;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('fr')) return 'fr';
  if (nav.startsWith('zh')) return 'zh';
  return 'en';
}

export function saveLang(lang: Lang): void {
  localStorage.setItem('diary-lang', lang);
}
