'use client';

import { useState } from 'react';

function formatWithCommas(value: string) {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString();
}

function stripCommas(value: string) {
  return value.replace(/[^0-9]/g, '');
}

export default function MoneyInput({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: number | null;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(
    defaultValue ? defaultValue.toLocaleString() : ''
  );

  return (
    <>
      <input type="hidden" name={name} value={stripCommas(display)} />
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => setDisplay(formatWithCommas(e.target.value))}
        placeholder={placeholder}
        className="form-input"
      />
    </>
  );
}
