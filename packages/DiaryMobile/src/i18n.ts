export type Lang = 'zh' | 'en' | 'fr';

export interface T {
  // App / Navigation
  appTitle: string;
  navAllEntries: string;

  // Settings drawer
  settings: string;
  version: string;
  language: string;

  // Month picker modal
  selectYearMonth: string;
  cancel: string;
  monthCellLabel: (month: number) => string; // 1-indexed

  // Calendar
  weekdays: string[];
  monthLabel: (year: number, month: number) => string; // month 0-indexed
  dateLabel: (date: Date) => string;
  locale: string;

  // Calendar screen section
  thisMonthDiary: string;
  recent3Btn: string;
  recent10Btn: string;
  allBtn: string;
  recent3Label: string;
  recent10Label: string;
  countOf: (shown: number, total: number) => string;
  noEntriesMonth: string;

  // Mood picker
  selectMood: string;
  clearMood: string;

  // Day screen
  writeStory: string;
  save: string;
  edit: string;
  delete: string;
  noEntriesToday: string;
  deleteEntryTitle: string;
  deleteEntryMsg: string;

  // All entries screen
  filterYearDisplay: (year: number) => string;
  filterMonthDisplay: (month: number) => string; // 0-indexed
  noYearDisplay: string;
  noMonthDisplay: string;
  clearFilter: string;
  current: string;
  dateFilterLabel: (year: number | null, month: number | null) => string; // month 0-indexed
  sectionLabelFiltered: (label: string) => string;
  allEntriesTitle: string;
  countTotal: (n: number) => string;
  noEntriesFiltered: (label: string) => string;
  noEntriesStart: string;
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_FR_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const WD_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const zh: T = {
  appTitle: '我的日记本',
  navAllEntries: '所有日记',
  settings: '设置',
  version: '版本',
  language: '语言',
  selectYearMonth: '选择年月',
  cancel: '取消',
  monthCellLabel: (m) => `${m}月`,
  weekdays: WD_ZH,
  monthLabel: (y, m) => `${y}年${m + 1}月`,
  dateLabel: (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WD_ZH[d.getDay()]}`,
  locale: 'zh-CN',
  thisMonthDiary: '本月日记',
  recent3Btn: '最近3',
  recent10Btn: '最近10',
  allBtn: '全部',
  recent3Label: '最近 3 篇',
  recent10Label: '最近 10 篇',
  countOf: (s, total) => `${s}/${total} 篇`,
  noEntriesMonth: '本月还没有日记，点击日期开始写吧！',
  selectMood: '选择心情',
  clearMood: '× 清除心情',
  writeStory: '写下这一天的故事...',
  save: '保存',
  edit: '编辑',
  delete: '删除',
  noEntriesToday: '今天还没有日记，写下第一篇吧！',
  deleteEntryTitle: '删除日记',
  deleteEntryMsg: '确定要删除这篇日记吗？',
  filterYearDisplay: (y) => `${y}年`,
  filterMonthDisplay: (m) => `${m + 1}月`,
  noYearDisplay: '--年',
  noMonthDisplay: '--月',
  clearFilter: '清除',
  current: '当前',
  dateFilterLabel: (y, m) =>
    y !== null && m !== null ? `${y}年${m + 1}月` :
    y !== null ? `${y}年` :
    m !== null ? `${m + 1}月` : '全部',
  sectionLabelFiltered: (label) => `${label}日记`,
  allEntriesTitle: '全部日记',
  countTotal: (n) => `${n} 篇`,
  noEntriesFiltered: (label) => `${label}暂无日记`,
  noEntriesStart: '还没有日记，从日历页开始写吧！',
};

const en: T = {
  appTitle: 'My Diary',
  navAllEntries: 'All Entries',
  settings: 'Settings',
  version: 'Version',
  language: 'Language',
  selectYearMonth: 'Select Month',
  cancel: 'Cancel',
  monthCellLabel: (m) => MONTHS_EN_SHORT[m - 1],
  weekdays: WD_EN,
  monthLabel: (y, m) => `${MONTHS_EN[m]} ${y}`,
  dateLabel: (d) => `${WD_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
  locale: 'en-US',
  thisMonthDiary: 'This Month',
  recent3Btn: 'Last 3',
  recent10Btn: 'Last 10',
  allBtn: 'All',
  recent3Label: 'Last 3',
  recent10Label: 'Last 10',
  countOf: (s, total) => `${s}/${total}`,
  noEntriesMonth: 'No entries this month. Tap a date to start writing!',
  selectMood: 'Select Mood',
  clearMood: '× Clear Mood',
  writeStory: 'Write your story for today...',
  save: 'Save',
  edit: 'Edit',
  delete: 'Delete',
  noEntriesToday: 'No entries today. Write your first one!',
  deleteEntryTitle: 'Delete Entry',
  deleteEntryMsg: 'Are you sure you want to delete this entry?',
  filterYearDisplay: (y) => `${y}`,
  filterMonthDisplay: (m) => MONTHS_EN_SHORT[m],
  noYearDisplay: '--',
  noMonthDisplay: '--',
  clearFilter: 'Clear',
  current: 'Current',
  dateFilterLabel: (y, m) =>
    y !== null && m !== null ? `${MONTHS_EN[m!]} ${y}` :
    y !== null ? `${y}` :
    m !== null ? MONTHS_EN[m!] : 'All',
  sectionLabelFiltered: (label) => label,
  allEntriesTitle: 'All Entries',
  countTotal: (n) => `${n} entr${n === 1 ? 'y' : 'ies'}`,
  noEntriesFiltered: (label) => `No entries for ${label}`,
  noEntriesStart: 'No entries yet. Start from the Calendar!',
};

const fr: T = {
  appTitle: 'Mon Journal',
  navAllEntries: 'Toutes les entrées',
  settings: 'Paramètres',
  version: 'Version',
  language: 'Langue',
  selectYearMonth: 'Choisir un mois',
  cancel: 'Annuler',
  monthCellLabel: (m) => MONTHS_FR_SHORT[m - 1],
  weekdays: WD_FR,
  monthLabel: (y, m) => `${MONTHS_FR[m]} ${y}`,
  dateLabel: (d) => `${WD_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
  locale: 'fr-FR',
  thisMonthDiary: 'Ce mois-ci',
  recent3Btn: '3 récents',
  recent10Btn: '10 récents',
  allBtn: 'Tout',
  recent3Label: '3 dernières',
  recent10Label: '10 dernières',
  countOf: (s, total) => `${s}/${total}`,
  noEntriesMonth: 'Aucune entrée ce mois-ci. Touchez une date pour commencer !',
  selectMood: 'Choisir une humeur',
  clearMood: "× Effacer l'humeur",
  writeStory: 'Écrivez votre histoire du jour...',
  save: 'Enregistrer',
  edit: 'Modifier',
  delete: 'Supprimer',
  noEntriesToday: "Aucune entrée aujourd'hui. Écrivez la première !",
  deleteEntryTitle: "Supprimer l'entrée",
  deleteEntryMsg: 'Voulez-vous vraiment supprimer cette entrée ?',
  filterYearDisplay: (y) => `${y}`,
  filterMonthDisplay: (m) => MONTHS_FR_SHORT[m],
  noYearDisplay: '--',
  noMonthDisplay: '--',
  clearFilter: 'Effacer',
  current: 'Actuel',
  dateFilterLabel: (y, m) =>
    y !== null && m !== null ? `${MONTHS_FR[m!]} ${y}` :
    y !== null ? `${y}` :
    m !== null ? MONTHS_FR[m!] : 'Tout',
  sectionLabelFiltered: (label) => label,
  allEntriesTitle: 'Toutes les entrées',
  countTotal: (n) => `${n} entrée${n > 1 ? 's' : ''}`,
  noEntriesFiltered: (label) => `Aucune entrée pour ${label}`,
  noEntriesStart: 'Aucune entrée. Commencez depuis le calendrier !',
};

const translations: Record<Lang, T> = { zh, en, fr };

export function getT(lang: Lang): T {
  return translations[lang] ?? zh;
}
