import { WORK_PHASES } from './types';

/** 全角数字・ピリオドを半角に変換 */
export function toHalfWidth(str: string) {
  return str.replace(/[０-９．]/g, (ch) =>
    ch === '．' ? '.' : String.fromCharCode(ch.charCodeAt(0) - 0xFEE0),
  );
}

/** 時間を日本語表示（1.5 → "1時間30分"） */
export function formatHoursJa(h: number): string {
  const totalMin = Math.round(h * 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs === 0) return `${mins}分`;
  if (mins === 0) return `${hrs}時間`;
  return `${hrs}時間${mins}分`;
}

/** 時間をh表示（1.5 → "1.5h", 0.25 → "0.25h"） 分析用 */
export function formatHoursH(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return `${rounded}h`;
}

/** 日付のみ表示（"2026/6/28"） date-only文字列用 */
export function formatDate(date: string | null, fallback = ''): string {
  if (!date) return fallback;
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 日付のみ表示（同年なら年省略） */
export function formatDateShort(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00');
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 日時表示（JSTに変換、時刻が00:00なら日付のみ） */
export function formatDateTime(date: string | null, fallback = ''): string {
  if (!date) return fallback;
  const d = new Date(date);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateStr = jst.getUTCFullYear() === now.getUTCFullYear()
    ? `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`
    : `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
  const h = jst.getUTCHours();
  const m = jst.getUTCMinutes();
  if (h === 0 && m === 0) return dateStr;
  return `${dateStr} ${h}:${String(m).padStart(2, '0')}`;
}

/** 日時表示（年付き、JST） */
export function formatDateTimeFull(date: string): string {
  const d = new Date(date);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()} ${jst.getUTCHours()}:${String(jst.getUTCMinutes()).padStart(2, '0')}`;
}

/** 時刻のみ表示（JST） */
export function formatTime(date: string): string {
  const d = new Date(date);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCHours()}:${String(jst.getUTCMinutes()).padStart(2, '0')}`;
}

/** 金額表示（"¥54,000"） */
export function formatYen(amount: number | null, fallback = ''): string {
  if (amount === null || amount === undefined) return fallback;
  return `¥${Math.round(amount).toLocaleString()}`;
}

/** 工程ラベル変換 */
export function phaseLabel(value: string | null): string | null {
  if (!value) return null;
  return WORK_PHASES.find((p) => p.value === value)?.label || value;
}

/** FormDataから数値取得（空ならnull） */
export function numOrNull(formData: FormData, key: string): number | null {
  const v = formData.get(key) as string;
  return v ? Number(v) : null;
}
