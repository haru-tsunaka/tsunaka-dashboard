'use client';

import { useState } from 'react';
import type { CaseContact } from '@/lib/types';

export default function ContactSection({
  contacts,
  addContactAction,
  deleteContactAction,
}: {
  contacts: CaseContact[];
  addContactAction: (formData: FormData) => Promise<void>;
  deleteContactAction: (formData: FormData) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {/* 担当者一覧 */}
      {contacts.length > 0 ? (
        <div className="space-y-3 mb-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-start justify-between bg-white rounded-lg border border-brand-border p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{contact.name}</span>
                  {contact.role && (
                    <span className="text-xs text-brand-muted">{contact.role}</span>
                  )}
                </div>
                {contact.department && (
                  <p className="text-xs text-brand-muted mb-1">{contact.department}</p>
                )}
                {contact.contact_method && contact.contact_info && (
                  <p className="text-xs text-brand-muted">
                    {contact.contact_method}: {contact.contact_info}
                  </p>
                )}
              </div>
              <form action={deleteContactAction}>
                <input type="hidden" name="contact_id" value={contact.id} />
                <button
                  type="submit"
                  className="text-brand-muted hover:text-red-500 transition-colors text-xs ml-3"
                >
                  削除
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-brand-muted text-sm mb-4">担当者が登録されていません</p>
      )}

      {/* 追加フォーム */}
      {showForm ? (
        <form action={async (formData) => {
          await addContactAction(formData);
          setShowForm(false);
        }} className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">名前 <span className="text-red-400">*</span></label>
              <input name="contact_name" required className="form-input" placeholder="山田太郎" />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">役職</label>
              <input name="contact_role" className="form-input" placeholder="代表 / 担当者" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">部門・組織名</label>
            <input name="contact_department" className="form-input" placeholder="実行委員会 / 広報部" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">連絡手段</label>
              <select name="contact_method" className="form-input">
                <option value="">未設定</option>
                <option value="Email">Email</option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="LINE">LINE</option>
                <option value="電話">電話</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">連絡先</label>
              <input name="contact_info" className="form-input" placeholder="メアド / ID" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors"
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-brand-muted hover:text-brand-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-navy hover:text-navy-light transition-colors"
        >
          + 担当者を追加
        </button>
      )}
    </div>
  );
}
