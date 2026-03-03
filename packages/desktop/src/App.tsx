·import { useState, useEffect, useRef } from 'react';
import { Entry } from '@diary/shared/types';

declare global {
  interface Window {
    electronAPI: {
      createEntry: (content: string, createdAt?: number) => Promise<Entry>;
      listEntries: () => Promise<Entry[]>;
      updateEntry: (id: string, content: string) => Promise<void>;
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

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const btnBase: React.CSSProperties = {
  cursor: 'pointer',
  border: 'none',
  borderRadius: '4px',
  fontSize: '13px',
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
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
            取消
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{ ...btnBase, padding: '8px 22px', backgroundColor: '#f44336', color: '#fff', fontSize: '14px' }}
          >
            删除
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

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
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
          <span style={{ fontSize: '17px', fontWeight: 'bold' }}>设置</span>
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
            <span>版本</span>
            <span style={{ color: '#888', fontSize: '13px' }}>v{APP_VERSION}</span>
          </li>
        </ul>
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
}: {
  currentMonth: Date;
  entries: Entry[];
  onMonthChange: (d: Date) => void;
  onDayClick: (d: Date) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const daysWithEntries = new Set(
    entries
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((e) => new Date(e.createdAt).getDate())
  );

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
          {year}年{month + 1}月
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
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
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
                justifyContent: 'center',
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
              {hasEntry && (
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#fff' : '#4CAF50',
                    marginTop: '3px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Recent entries */}
      <RecentEntries entries={entries} year={year} month={month} onDayClick={onDayClick} />
    </div>
  );
}

// ─── Recent Entries ────────────────────────────────────────────────────────────

function RecentEntries({
  entries,
  year,
  month,
  onDayClick,
}: {
  entries: Entry[];
  year: number;
  month: number;
  onDayClick: (d: Date) => void;
}) {
  const [limit, setLimit] = useState(3);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const monthEntries = [...entries]
    .filter((e) => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);

  if (monthEntries.length === 0) return null;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#555', margin: 0 }}>
          本月日记
        </h3>
        <label style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
          显示
          <input
            type="number"
            min={1}
            max={99}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
            style={{ width: '44px', padding: '2px 4px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
          />
          个
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {monthEntries.map((entry) => {
          const d = new Date(entry.createdAt);
          const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`;
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
                style={{ fontSize: '12px', color: '#888', marginBottom: '5px', cursor: 'pointer' }}
              >
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
                {isExpanded ? '收起 ▲' : '展开 ▼'}
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
}: {
  date: Date;
  allEntries: Entry[];
  onBack: () => void;
  onRefresh: () => void;
}) {
  const dayEntries = allEntries.filter((e) => isSameDay(new Date(e.createdAt), date));
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${WEEKDAYS[date.getDay()]}`;

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
    await window.electronAPI.createEntry(content, dateStamp());
    setContent('');
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
  }

  async function handleUpdate() {
    if (!editingId || !editContent.trim()) return;
    await window.electronAPI.updateEntry(editingId, editContent);
    setEditingId(null);
    onRefresh();
  }

  return (
    <div style={{ padding: '28px', fontFamily: 'sans-serif', maxWidth: '680px', margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{ ...btnBase, padding: '6px 14px', backgroundColor: '#f0f0f0', marginBottom: '16px', fontSize: '14px' }}
      >
        ← 返回日历
      </button>
      <h2 style={{ margin: '0 0 20px', fontSize: '22px' }}>{dateLabel}</h2>

      {/* New entry */}
      <div style={{ marginBottom: '28px' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下这一天的故事..."
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
        <button
          onClick={handleSave}
          style={{ ...btnBase, marginTop: '8px', padding: '8px 20px', backgroundColor: '#4CAF50', color: 'white', fontSize: '14px' }}
        >
          保存 (Ctrl+Enter)
        </button>
      </div>

      {/* Entries */}
      {dayEntries.length === 0 ? (
        <p style={{ color: '#aaa' }}>今天还没有日记，写下第一篇吧！</p>
      ) : (
        dayEntries.map((entry) => (
          <div
            key={entry.id}
            style={{ border: '1px solid #e0e0e0', padding: '14px', marginBottom: '10px', borderRadius: '8px', position: 'relative' }}
          >
            <small style={{ color: '#aaa' }}>
              {new Date(entry.createdAt).toLocaleTimeString('zh-CN')}
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
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                  <button onClick={handleUpdate} style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#4CAF50', color: 'white' }}>
                    保存 (Ctrl+Enter)
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#999', color: 'white' }}>
                    取消 (Esc)
                  </button>
                </div>
              </>
            ) : (
              <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
            )}
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
              {editingId !== entry.id && (
                <button onClick={() => startEdit(entry)} style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#2196F3', color: 'white' }}>
                  编辑
                </button>
              )}
              <button onClick={() => handleDelete(entry.id)} style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#f44336', color: 'white' }}>
                删除
              </button>
            </div>
          </div>
        ))
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message="确认删除这篇日记？"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── All Entries View ─────────────────────────────────────────────────────────

function AllEntriesView({ entries, onRefresh }: { entries: Entry[]; onRefresh: () => void }) {
  const now = new Date();
  const [filterYear, setFilterYear] = useState<number | null>(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(now.getMonth() + 1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  return (
    <div style={{ padding: '28px', fontFamily: 'sans-serif', maxWidth: '680px', margin: '0 auto' }}>
      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={filterYear ?? ''}
          onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : null)}
          style={{ fontSize: '14px', padding: '5px 8px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">所有年份</option>
          {years.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>

        <select
          value={filterMonth ?? ''}
          onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : null)}
          style={{ fontSize: '14px', padding: '5px 8px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">所有月份</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={() => { setFilterYear(null); setFilterMonth(null); }}
            style={{ ...btnBase, padding: '5px 14px', backgroundColor: '#f0f0f0', color: '#555', fontSize: '13px' }}
          >
            清除
          </button>
        )}
        <button
          onClick={() => { setFilterYear(now.getFullYear()); setFilterMonth(now.getMonth() + 1); }}
          style={{ ...btnBase, padding: '5px 14px', backgroundColor: '#e8f5e9', color: '#4CAF50', fontSize: '13px' }}
        >
          当前
        </button>

        <span style={{ color: '#aaa', fontSize: '13px', marginLeft: 'auto' }}>
          共 {filtered.length} 篇
        </span>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <p style={{ color: '#aaa' }}>暂无日记</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((entry) => {
            const d = new Date(entry.createdAt);
            const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`;
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
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                  {label} · {d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>

                {isEditing ? (
                  <>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', marginTop: '4px', padding: '8px', fontSize: '14px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #aaa', resize: 'vertical' }}
                      onKeyDown={async (e) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                          if (editContent.trim()) { await window.electronAPI.updateEntry(entry.id, editContent); setEditingId(null); onRefresh(); }
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                      <button
                        onClick={async () => { if (editContent.trim()) { await window.electronAPI.updateEntry(entry.id, editContent); setEditingId(null); onRefresh(); } }}
                        style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#4CAF50', color: 'white', fontSize: '13px' }}
                      >
                        保存 (Ctrl+Enter)
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ ...btnBase, padding: '4px 12px', backgroundColor: '#999', color: 'white', fontSize: '13px' }}
                      >
                        取消 (Esc)
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
                      onClick={() => { setEditingId(entry.id); setEditContent(entry.content); }}
                      style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#2196F3', color: 'white', fontSize: '12px' }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(entry.id)}
                      style={{ ...btnBase, padding: '3px 8px', backgroundColor: '#f44336', color: 'white', fontSize: '12px' }}
                    >
                      删除
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
          message="确认删除这篇日记？"
          onConfirm={async () => {
            await window.electronAPI.deleteEntry(pendingDeleteId);
            setPendingDeleteId(null);
            onRefresh();
          }}
          onCancel={() => setPendingDeleteId(null)}
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
        <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>我的日记本</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Calendar icon */}
          <button
            title="日历"
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
            title="所有日记"
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
            title="设置"
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
          />
        ) : view === 'list' ? (
          <AllEntriesView entries={entries} onRefresh={loadEntries} />
        ) : (
          <CalendarView
            currentMonth={currentMonth}
            entries={entries}
            onMonthChange={setCurrentMonth}
            onDayClick={setSelectedDate}
          />
        )}
      </div>

      {/* Settings right panel */}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default App;
