'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className || 'w-full py-3 rounded-lg bg-navy text-white font-medium text-sm tracking-wide hover:bg-navy-light transition-colors active:scale-[0.98] disabled:opacity-50'}
    >
      {pending ? (pendingLabel || '送信中...') : label}
    </button>
  );
}
