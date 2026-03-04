import { useState, useEffect, useRef } from 'react';
import { Entry } from '@diary/shared/types';
import { type Lang, type T, getT, detectLang, saveLang } from './i18n';

declare global {
  interface Window {
    electronAPI: {
      createEntry: (content: string, createdAt?: number, mood?: string) => Promise<Entry>;
      listEntries: () => Promise<Entry[]>;
      updateEntry: (id: string, content: string) => Promise<void>;
      updateMood: (id: string, mood: string | null) => Promise<void>;
      deleteEntry: (id: string) => Promise<void>;
    };
  }
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '—';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MOODS = [
  '😊','😄','😁','😍','🥰','😌','😎','🤩',
  '😔','😢','😭','😤','😠','😰','😨','😱',
  '😴','🥱','🤔','🤗','😲','🥳','😏','🙄',
];

const btnBase: React.CSSProperties = {
  cursor: 'pointer',
  border: 'none',
  borderRadius: '4px',
  fontSize: '13px',
};

// ─── Mood Picker ──────────────────────────────────────────────────────────────

function MoodPicker({ value, onChange, t }: { value: string | null; onChange: (mood: string | null) => void; t: T }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={value ? t.moodTitle(value) : t.addMood}
        style={{
          fontSize: value ? '22px' : '16px',
          width: '38px',
          height: '38px',
          border: value ? '2px solid #4CAF50' : '2px dashed #ccc',
          borderRadius: '8px',
          background: value ? '#e8f5e9' : '#fafafa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          color: '#aaa',
        }}
      >
        {value ?? '＋'}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '44px',
          left: 0,
          zIndex: 50,
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          padding: '8px',
          width: '296px',
        }}>
          {value && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                fontSize: '12px',
                color: '#f44336',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px 6px',
              }}
            >
              {t.clearMood}
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => { onChange(m); setOpen(false); }}
                style={{
                  fontSize: '20px',
                  width: '32px',
                  height: '32px',
                  border: m === value ? '2px solid #4CAF50' : '1px solid transparent',
                  borderRadius: '6px',
                  background: m === value ? '#e8f5e9' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => { if (m !== value) e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { if (m !== value) e.currentTarget.style.background = 'none'; }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel, t }: { message: string; onConfirm: () => void; onCancel: () => void; t: T }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        padding: '28px 32px',
        minWidth: '280px',
        maxWidth: '360px',
        textAlign: 'center',
        animation: 'fadeScaleIn 0.15s ease',
      }}>
        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#333', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{ ...btnBase, padding: '8px 22px', backgroundColor: '#f0f0f0', color: '#555', fontSize: '14px' }}
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{ ...btnBase, padding: '8px 22px', backgroundColor: '#f44336', color: '#fff', fontSize: '14px' }}
          >
            {t.delete}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({
  onClose,
  t,
  lang,
  onLangChange,
}: {
  onClose: () => void;
  t: T;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        style={{
          width: '280px',
          height: '100%',
          backgroundColor: '#fff',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s ease',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#4CAF50',
            color: '#fff',
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 'bold' }}>{t.settings}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Menu items */}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
          <li
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #f0f0f0',
              fontSize: '15px',
              color: '#333',
            }}
          >
            <span>{t.version}</span>
            <span style={{ color: '#888', fontSize: '13px' }}>v{APP_VERSION}</span>
          </li>
        </ul>

        {/* Language selector — bottom, centered, padding-bottom 10px */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 20px 10px' }}>
          <select
            value={lang}
            onChange={(e) => onLangChange(e.target.value as Lang)}
            style={{
              fontSize: '14px',
              padding: '6px 10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  currentMonth,
  entries,
  onMonthChange,
  onDayClick,
  t,
}: {
  currentMonth: Date;
  entries: Entry[];
  onMonthChange: (d: Date) => void;
  onDayClick: (d: Date) => void;
  t: T;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const daysWithEntries = new Set<number>();
  const dayMoodsMap = new Map<number, string[]>();
  [...entries]
    .filter((e) => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((e) => {
      const day = new Date(e.createdAt).getDate();
      daysWithEntries.add(day);
      if (e.mood) {
        const arr = dayMoodsMap.get(day) ?? [];
        if (arr.length < 3) { arr.push(e.mood); dayMoodsMap.set(day, arr); }
      }
    });

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`;

  function handleMonthInput(e: React.ChangeEvent<HTMLInputElement>) {
    const [y, m] = e.target.value.split('-').map(Number);
    onMonthChange(new Date(y, m - 1, 1));
  }

  return (
    <div style={{ padding: '28px', fontFamily: 'sans-serif', maxWidth: '680px', margin: '0 auto' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <input
          type="month"
          value={monthValue}
          onChange={handleMonthInput}
          style={{ fontSize: '15px', padding: '4px 8px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          style={{ ...btnBase, padding: '6px 14px', backgroundColor: '#f0f0f0', fontSize: '18px' }}
        >
          ‹
        </button>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
          {t.monthLabel(year, month)}
        </span>
        <button
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          style={{ ...btnBase, padding: '6px 14px', backgroundColor: '#f0f0f0', fontSize: '18px' }}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '6px' }}>
        {t.weekdays.map((w, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '13px',
              color: i === 0 ? '#e57373' : i === 6 ? '#64b5f6' : '#666',
              padding: '4px 0',
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ aspectRatio: '1' }} />;
          const isToday = isSameDay(new Date(year, month, day), today);
          const hasEntry = daysWithEntries.has(day);
          const dow = (firstDow + day - 1) % 7;
          const isSun = dow === 0;
          const isSat = dow === 6;

          let bg = '#f5f5f5';
          let textColor = isSun ? '#e57373' : isSat ? '#64b5f6' : '#333';
          let hoverBg = '#e0e0e0';

          if (isToday) {
            bg = '#4CAF50';
            textColor = '#fff';
            hoverBg = '#43A047';
          } else if (hasEntry) {
            bg = '#e8f5e9';
            hoverBg = '#c8e6c9';
          }

          return (
            <div
              key={i}
              onClick={() => onDayClick(new Date(year, month, day))}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '18%',
                boxSizing: 'border-box',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid #e0e0e0',
                backgroundColor: bg,
                color: textColor,
                fontWeight: isToday ? 'bold' : 'normal',
                fontSize: '14px',
                transition: 'background 0.12s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
            >
              {day}
              {hasEntry && (() => {
                const moods = dayMoodsMap.get(day) ?? [];
                if (moods.length > 0) {
                  return (
                    <div style={{ display: 'flex', gap: '1px', marginTop: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {moods.map((m, idx) => (
                        <span key={idx} style={{ fontSize: '13px', lineHeight: 1 }}>{m}</span>
                      ))}
                    </div>
                  );
                }
                return (
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isToday ? '#fff' : '#4CAF50', marginTop: '3px' }} />
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Recent entries */}
      <RecentEntries entries={entries} year={year} month={month} onDayClick={onDayClick} t={t} />
    </div>
  );
}

// ─── Recent Entries ────────────────────────────────────────────────────────────

function RecentEntries({
  entries,
  year,
  month,
  onDayClick,
  t,
}: {
  entries: Entry[];
  year: number;
  month: number;
  onDayClick: (d: Date) => void;
  t: T;
}) {
  const [pageSize, setPageSize] = useState(3);
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const allMonthEntries = [...entries]
    .filter((e) => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(allMonthEntries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const monthEntries = pageSize === 0 ? allMonthEntries : allMonthEntries.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (allMonthEntries.length === 0) return null;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#555', margin: 0, marginRight: '4px' }}>
          {t.thisMonthDiary}
        </h3>
        <span style={{ fontSize: '20px', color: '#888' }}>{t.perPage}</span>
        {[3, 5, 10, 0].map((n) => (
          <button
            key={n}
            onClick={() => { setPageSize(n); setPage(1); }}
            style={{
              ...btnBase,
              padding: '3px 14px',
              fontSize: '18px',
              backgroundColor: pageSize === n ? '#4CAF50' : '#f0f0f0',
              color: pageSize === n ? '#fff' : '#555',
            }}
          >
            {n === 0 ? t.allBtn : n}
          </button>
        ))}
        {pageSize !== 0 && totalPages > 1 && (
          <>
            <span style={{ fontSize: '20px', color: '#aaa', marginLeft: '4px' }}>
              {t.pageOf(safePage, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ ...btnBase, padding: '3px 12px', fontSize: '20px', backgroundColor: safePage === 1 ? '#f5f5f5' : '#f0f0f0', color: safePage === 1 ? '#ccc' : '#555' }}
            >
              ‹
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ ...btnBase, padding: '3px 12px', fontSize: '20px', backgroundColor: safePage === totalPages ? '#f5f5f5' : '#f0f0f0', color: safePage === totalPages ? '#ccc' : '#555' }}
            >
              ›
            </button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {monthEntries.map((entry) => {
          const d = new Date(entry.createdAt);
          const label = t.dateLabel(d);
          const isExpanded = expandedIds.has(entry.id);
          return (
            <div
              key={entry.id}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f7f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
            >
              <div
                onClick={() => onDayClick(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                style={{ fontSize: '12px', color: '#888', marginBottom: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {entry.mood && <span style={{ fontSize: '16px' }}>{entry.mood}</span>}
                {label}
              </div>
              <div
                onClick={() => onDayClick(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                style={{
                  fontSize: '14px',
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5',
                  cursor: 'pointer',
                  ...(isExpanded
                    ? {}
                    : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }),
                }}
              >
                {entry.content}
              </div>
              <button
                onClick={() => toggleExpand(entry.id)}
                style={{ marginTop: '5px', background: 'none', border: 'none', color: '#4CAF50', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                {isExpanded ? t.collapse : t.expand}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  date,
  allEntries,
  onBack,
  onRefresh,
  t,
}: {
  date: Date;
  allEntries: Entry[];
  onBack: () => void;
  onRefresh: () => void;
  t: T;
}) {
  const dayEntries = allEntries.filter((e) => isSameDay(new Date(e.createdAt), date));
  const [content, setContent] = useState('');
  const [newMood, setNewMood] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const dateLabel = t.dateLabel(date);

  function dateStamp() {
    const now = new Date();
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    ).getTime();
  }

  async function handleSave() {
    if (!content.trim()) return;
    await window.electronAPI.createEntry(content, dateStamp(), newMood || undefined);
    setContent('');
    setNewMood(null);
    onRefresh();
  }

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await window.electronAPI.deleteEntry(pendingDeleteId);
    setPendingDeleteId(null);
    onRefresh();
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditMood(entry.mood ?? null);
  }

  async function handleUpdate() {
    if (!editingId || !editContent.trim()) return;
    await window.electronAPI.updateEntry(editingId, editContent);
    await window.electronAPI.updateMood(editingId, editMood);
    setEditingId(null);
    onRefresh();
  }

  return (
    <div style={{ padding: '28px', fontFamily: 'sans-serif', maxWidth: '680px', margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{ ...btnBase, padding: '6px 14px', backgroundColor: '#f0f0f0', marginBottom: '16px', fontSize: '14px' }}
      >
        {t.backToCalendar}
      </button>
      <h2 style={{ margin: '0 0 20px', fontSize: '22px' }}>{dateLabel}</h2>

      {/* New entry */}
      <div style={{ marginBottom: '28px' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.writeStory}
          style={{
            width: '100%',
            height: '140px',
            padding: '10px',
            fontSize: '15px',
            boxSizing: 'border-box',
            borderRadius: '6px',
            border: '1px solid #ddd',
            resize: 'vertical',
          }}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') handleSave();
          }}
        />
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MoodPicker value={newMood} onChange={setNewMood} t={t} />
          <button
            onClick={handleSave}
            style={{ ...btnBase, padding: '8px 20px', backgroundColor: '#4CAF50', color: 'white', fontSize: '14px' }}
          >
            {t.save}
          </button>
        </div>
      </div>

      {/* Entries */}
      {dayEntries.length === 0 ? (
        <p style={{ color: '#aaa' }}>{t.noEntriesToday}</p>
      ) : (
        dayEntries.map((entry) => (
          <div
            key={entry.id}
            style={{ border: '1px solid #e0e0e0', padding: '14px', marginBottom: '10px', borderRadius: '8px', position: 'relative' }}
          >
            <small style={{ color: '#aaa' }}>
              {new Date(entry.createdAt).toLocaleTimeString(t.locale)}
            </small>
            {editingId === entry.id ? (
              <>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', marginTop: '8px', padding: '8px', fontSize: '15px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #aaa', resize: 'vertical' }}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') handleUpdate();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                />
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <MoodPicker value={editMood} onChange={setEditMood} t={t} />
                  <button onClick={handleUpdate} style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#4CAF50', color: 'white' }}>
                    {t.save}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#999', color: 'white' }}>
                    {t.cancelEsc}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
                {entry.mood && <span style={{ fontSize: '26px', flexShrink: 0, lineHeight: '1.4' }}>{entry.mood}</span>}
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{entry.content}</p>
              </div>
            )}
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
              {editingId !== entry.id && (
                <button onClick={() => startEdit(entry)} style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#2196F3', color: 'white' }}>
                  {t.edit}
                </button>
              )}
              <button onClick={() => handleDelete(entry.id)} style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#f44336', color: 'white' }}>
                {t.delete}
              </button>
            </div>
          </div>
        ))
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message={t.confirmDeleteMessage}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── All Entries View ─────────────────────────────────────────────────────────

function AllEntriesView({ entries, onRefresh, t }: { entries: Entry[]; onRefresh: () => void; t: T }) {
  const now = new Date();
  const [filterYear, setFilterYear] = useState<number | null>(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(now.getMonth() + 1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const years = [...new Set([
    now.getFullYear(),
    ...entries.map((e) => new Date(e.createdAt).getFullYear()),
  ])].sort((a, b) => b - a);

  const filtered = [...entries]
    .filter((e) => {
      const d = new Date(e.createdAt);
      if (filterYear !== null && d.getFullYear() !== filterYear) return false;
      if (filterMonth !== null && d.getMonth() + 1 !== filterMonth) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const isFiltered = filterYear !== null || filterMonth !== null;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = pageSize === 0 ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetPage() { setPage(1); }
  function changeFilter(year: number | null, month: number | null) {
    setFilterYear(year); setFilterMonth(month); resetPage();
  }

  return (
    <div style={{ padding: '28px', fontFamily: 'sans-serif', maxWidth: '680px', margin: '0 auto' }}>
      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={filterYear ?? ''}
          onChange={(e) => changeFilter(e.target.value ? Number(e.target.value) : null, filterMonth)}
          style={{ fontSize: '21px', padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">{t.allYears}</option>
          {years.map((y) => <option key={y} value={y}>{t.yearOption(y)}</option>)}
        </select>

        <select
          value={filterMonth ?? ''}
          onChange={(e) => changeFilter(filterYear, e.target.value ? Number(e.target.value) : null)}
          style={{ fontSize: '21px', padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">{t.allMonths}</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{t.monthOption(m)}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={() => changeFilter(null, null)}
            style={{ ...btnBase, padding: '8px 21px', backgroundColor: '#f0f0f0', color: '#555', fontSize: '20px' }}
          >
            {t.clearFilter}
          </button>
        )}
        <button
          onClick={() => changeFilter(now.getFullYear(), now.getMonth() + 1)}
          style={{ ...btnBase, padding: '8px 21px', backgroundColor: '#e8f5e9', color: '#4CAF50', fontSize: '20px' }}
        >
          {t.current}
        </button>

        <span style={{ color: '#aaa', fontSize: '20px', marginLeft: 'auto' }}>
          {t.totalEntries(filtered.length)}
        </span>
      </div>

      {/* Page size row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
        <span style={{ fontSize: '20px', color: '#888' }}>{t.perPage}</span>
        {[5, 10, 20, 0].map((n) => (
          <button
            key={n}
            onClick={() => { setPageSize(n); resetPage(); }}
            style={{
              ...btnBase,
              padding: '3px 14px',
              fontSize: '18px',
              backgroundColor: pageSize === n ? '#4CAF50' : '#f0f0f0',
              color: pageSize === n ? '#fff' : '#555',
            }}
          >
            {n === 0 ? t.allBtn : n}
          </button>
        ))}
        {pageSize !== 0 && totalPages > 1 && (
          <>
            <span style={{ fontSize: '20px', color: '#aaa', marginLeft: '8px' }}>
              {t.pageOf(safePage, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ ...btnBase, padding: '3px 12px', fontSize: '20px', backgroundColor: safePage === 1 ? '#f5f5f5' : '#f0f0f0', color: safePage === 1 ? '#ccc' : '#555' }}
            >
              ‹
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ ...btnBase, padding: '3px 12px', fontSize: '20px', backgroundColor: safePage === totalPages ? '#f5f5f5' : '#f0f0f0', color: safePage === totalPages ? '#ccc' : '#555' }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <p style={{ color: '#aaa' }}>{t.noEntries}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paged.map((entry) => {
            const d = new Date(entry.createdAt);
            const label = t.dateLabel(d);
            const isEditing = editingId === entry.id;
            return (
              <div
                key={entry.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa',
                  transition: 'background 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f7f0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
              >
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {entry.mood && <span style={{ fontSize: '16px' }}>{entry.mood}</span>}
                  {label} · {d.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' })}
                </div>

                {isEditing ? (
                  <>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', marginTop: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #aaa', resize: 'vertical' }}
                      onKeyDown={async (e) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                          if (editContent.trim()) {
                            await window.electronAPI.updateEntry(entry.id, editContent);
                            await window.electronAPI.updateMood(entry.id, editMood);
                            setEditingId(null);
                            onRefresh();
                          }
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <MoodPicker value={editMood} onChange={setEditMood} t={t} />
                      <button
                        onClick={async () => {
                          if (editContent.trim()) {
                            await window.electronAPI.updateEntry(entry.id, editContent);
                            await window.electronAPI.updateMood(entry.id, editMood);
                            setEditingId(null);
                            onRefresh();
                          }
                        }}
                        style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#4CAF50', color: 'white', fontSize: '13px' }}
                      >
                        {t.save}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#999', color: 'white', fontSize: '13px' }}
                      >
                        {t.cancelEsc}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {entry.content}
                  </div>
                )}

                {!isEditing && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { setEditingId(entry.id); setEditContent(entry.content); setEditMood(entry.mood ?? null); }}
                      style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#2196F3', color: 'white', fontSize: '12px' }}
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(entry.id)}
                      style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#f44336', color: 'white', fontSize: '12px' }}
                    >
                      {t.delete}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message={t.confirmDeleteMessage}
          onConfirm={async () => {
            await window.electronAPI.deleteEntry(pendingDeleteId);
            setPendingDeleteId(null);
            onRefresh();
          }}
          onCancel={() => setPendingDeleteId(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState<Lang>(() => detectLang());

  const t = getT(lang);

  function handleLangChange(l: Lang) {
    setLang(l);
    saveLang(l);
  }

  const calendarActive = view === 'calendar' && selectedDate === null;
  const listActive = view === 'list';

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    const data = await window.electronAPI.listEntries();
    setEntries(data);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '52px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{t.appTitle}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Calendar icon */}
          <button
            title={t.navCalendar}
            onClick={() => { setView('calendar'); setSelectedDate(null); }}
            disabled={calendarActive}
            style={{
              background: calendarActive ? '#fff' : 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              color: calendarActive ? '#4CAF50' : '#fff',
              width: '38px',
              height: '38px',
              cursor: calendarActive ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
              padding: 0,
            }}
            onMouseEnter={(e) => { if (!calendarActive) e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
            onMouseLeave={(e) => { if (!calendarActive) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>

          {/* List icon */}
          <button
            title={t.navAllEntries}
            onClick={() => { setView('list'); setSelectedDate(null); }}
            disabled={listActive}
            style={{
              background: listActive ? '#fff' : 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              color: listActive ? '#4CAF50' : '#fff',
              width: '38px',
              height: '38px',
              cursor: listActive ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
              padding: 0,
            }}
            onMouseEnter={(e) => { if (!listActive) e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
            onMouseLeave={(e) => { if (!listActive) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>

          {/* Settings icon */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={t.navSettings}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '20px',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {selectedDate ? (
          <DayView
            date={selectedDate}
            allEntries={entries}
            onBack={() => setSelectedDate(null)}
            onRefresh={loadEntries}
            t={t}
          />
        ) : view === 'list' ? (
          <AllEntriesView entries={entries} onRefresh={loadEntries} t={t} />
        ) : (
          <CalendarView
            currentMonth={currentMonth}
            entries={entries}
            onMonthChange={setCurrentMonth}
            onDayClick={setSelectedDate}
            t={t}
          />
        )}
      </div>

      {/* Settings right panel */}
      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          t={t}
          lang={lang}
          onLangChange={handleLangChange}
        />
      )}
    </div>
  );
}

export default App;
