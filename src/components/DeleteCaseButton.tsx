'use client';

import { useState } from 'react';

export default function DeleteCaseButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-brand-muted hover:text-red-500 transition-colors"
      >
        この案件を削除する
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-red-500">本当に削除しますか？</p>
      <form action={deleteAction}>
        <button
          type="submit"
          className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
        >
          削除する
        </button>
      </form>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs text-brand-muted hover:text-brand-text transition-colors"
      >
        キャンセル
      </button>
    </div>
  );
}
