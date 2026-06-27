'use client';

import { useState } from 'react';
import SubmitButton from './SubmitButton';

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
        このおもいを削除する
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-red-500">本当に削除しますか？</p>
      <form action={deleteAction}>
        <SubmitButton
          label="削除する"
          pendingLabel="削除中..."
          className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
        />
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
