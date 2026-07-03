'use client';

import { useState, useEffect } from 'react';
import type { Case } from '@/lib/types';
import { WORK_PHASES } from '@/lib/types';
import { formatHoursJa } from '@/lib/formatting';
import SubmitButton from './SubmitButton';

const STORAGE_KEY = 'hitoha_start_time';

function toLocalDatetime(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function nowJST() {
  return toLocalDatetime(new Date());
}

function todayJST() {
  return nowJST().slice(0, 10);
}

function minutesAgo(min: number) {
  return toLocalDatetime(new Date(Date.now() - min * 60 * 1000));
}

function titlePlaceholder(phase: string): string {
  switch (phase) {
    case 'meeting': return 'ヒアリング、仕様確認など';
    case 'planning': return '構成案づくり、絵コンテなど';
    case 'shooting': return 'インタビュー撮影、ロケなど';
    case 'editing': return 'カット編集、カラグレなど';
    case 'travel': return '渋谷→横浜';
    case 'development': return 'コーディング、サイト構築など';
    default: return '';
  }
}

function memoPlaceholder(phase: string): string {
  switch (phase) {
    case 'meeting': return '決まったこと、宿題など';
    case 'planning': return '';
    case 'shooting': return '天候、機材メモなど';
    case 'editing': return '';
    case 'travel': return '電車、タクシーなど';
    case 'development': return '';
    default: return '';
  }
}

function calcHours(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return null;
  return Math.round(((e - s) / (1000 * 60 * 60)) * 100) / 100;
}

export default function LogForm({
  cases,
  action,
  defaultCaseId,
  defaultTitle,
  defaultContent,
}: {
  cases: Case[];
  action: (formData: FormData) => Promise<void>;
  defaultCaseId?: string;
  defaultTitle?: string;
  defaultContent?: string;
}) {
  const [workPhase, setWorkPhase] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [saved, setSaved] = useState(false);
  const hours = calcHours(startedAt, endedAt);
  const isTravel = workPhase === 'travel';

  // ページ読み込み時にlocalStorageから開始時間を復元
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setStartedAt(stored);
      setSaved(true);
    }
  }, []);

  // 開始時間を記憶する
  function saveStartTime(time: string) {
    setStartedAt(time);
    localStorage.setItem(STORAGE_KEY, time);
    setSaved(true);
  }

  // 記憶をクリア
  function clearSavedTime() {
    localStorage.removeItem(STORAGE_KEY);
    setSaved(false);
  }

  return (
    <form action={async (formData) => {
      await action(formData);
      clearSavedTime();
      setWorkPhase('');
      setStartedAt('');
      setEndedAt('');
    }} className="bg-white rounded-lg border border-brand-border p-5 space-y-4">
      {/* 案件 */}
      <div>
        <label className="block text-xs text-brand-muted mb-1.5">おもい</label>
        <select name="case_id" required defaultValue={defaultCaseId || ''} className="form-input">
          <option value="">選択してください</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.client_name ? ` (${c.client_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 工程 */}
      <div>
        <label className="block text-xs text-brand-muted mb-1.5">工程</label>
        <select name="work_phase" required value={workPhase} onChange={(e) => setWorkPhase(e.target.value)} className="form-input">
          <option value="" disabled>選択してください</option>
          {WORK_PHASES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* 時間 */}
      <div>
        <label className="block text-xs text-brand-muted mb-1.5">時間</label>
        <div className="space-y-3">
          {/* 開始 */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-brand-muted">開始</span>
              <button
                type="button"
                onClick={() => saveStartTime(nowJST())}
                className="text-[10px] px-1.5 py-0.5 rounded bg-navy/10 text-navy font-medium hover:bg-navy/20 transition-colors"
              >
                いま
              </button>
              <button
                type="button"
                onClick={() => setStartedAt(minutesAgo(60))}
                className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted hover:text-navy transition-colors"
              >
                1時間前
              </button>
              <button
                type="button"
                onClick={() => setStartedAt(minutesAgo(30))}
                className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted hover:text-navy transition-colors"
              >
                30分前
              </button>
              <button
                type="button"
                onClick={() => setStartedAt(minutesAgo(15))}
                className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted hover:text-navy transition-colors"
              >
                15分前
              </button>
            </div>
            <input
              type="datetime-local"
              name="started_at"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="form-input w-full min-w-0"
            />
            {saved && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-navy font-medium">開始時間を記憶中</span>
                <button
                  type="button"
                  onClick={() => { clearSavedTime(); setStartedAt(''); }}
                  className="text-[10px] text-brand-muted hover:text-red-500 transition-colors"
                >
                  クリア
                </button>
              </div>
            )}
          </div>
          {/* 終了 */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-brand-muted">終了</span>
              <button
                type="button"
                onClick={() => setEndedAt(nowJST())}
                className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted hover:text-navy transition-colors"
              >
                いま
              </button>
            </div>
            <input
              type="datetime-local"
              name="ended_at"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="form-input w-full min-w-0"
            />
          </div>
        </div>
        <input type="hidden" name="hours" value={hours ?? ''} />
        {hours !== null && (
          <p className="text-right text-sm font-bold text-navy mt-2">{formatHoursJa(hours)}</p>
        )}
      </div>

      {/* やったこと */}
      <div>
        <label className="block text-xs text-brand-muted mb-1.5">{isTravel ? '経路' : 'やったこと'}</label>
        <input
          name="title"
          required
          defaultValue={defaultTitle || ''}
          placeholder={titlePlaceholder(workPhase)}
          className="form-input"
        />
      </div>

      {/* 交通費（移動時のみ） */}
      {isTravel && (
        <div>
          <label className="block text-xs text-brand-muted mb-1.5">交通費（円）</label>
          <input
            type="text"
            inputMode="numeric"
            name="expense_amount"
            placeholder="580"
            className="form-input"
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
            }}
          />
        </div>
      )}

      {/* メモ */}
      <div>
        <label className="block text-xs text-brand-muted mb-1.5">メモ（任意）</label>
        <textarea
          name="content"
          rows={2}
          defaultValue={defaultContent || ''}
          placeholder={memoPlaceholder(workPhase)}
          className="form-input resize-none"
        />
      </div>

      <SubmitButton label="きろく" pendingLabel="記録中..." />
    </form>
  );
}
