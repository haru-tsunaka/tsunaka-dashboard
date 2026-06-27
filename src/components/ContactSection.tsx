'use client';

import { useState } from 'react';
import type { CaseContact } from '@/lib/types';
import SubmitButton from './SubmitButton';

export default function ContactSection({
  contacts,
  addContactAction,
  updateContactAction,
  deleteContactAction,
}: {
  contacts: CaseContact[];
  addContactAction: (formData: FormData) => Promise<void>;
  updateContactAction: (formData: FormData) => Promise<void>;
  deleteContactAction: (formData: FormData) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      {/* 担当者一覧 */}
      {contacts.length > 0 ? (
        <div className="space-y-3 mb-4">
          {contacts.map((contact) => (
            editingId === contact.id ? (
              <ContactForm
                key={contact.id}
                contact={contact}
                action={async (formData) => {
                  await updateContactAction(formData);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                submitLabel="保存"
              />
            ) : (
              <div key={contact.id} className="bg-white rounded-lg border border-brand-border p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{contact.name}</span>
                      {contact.name_reading && (
                        <span className="text-xs text-brand-muted">({contact.name_reading})</span>
                      )}
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
                    {contact.memo && (
                      <p className="text-xs text-brand-muted mt-2 whitespace-pre-wrap border-t border-brand-border pt-2">{contact.memo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => setEditingId(contact.id)}
                      className="text-brand-muted hover:text-navy transition-colors text-xs"
                    >
                      編集
                    </button>
                    <form action={deleteContactAction}>
                      <input type="hidden" name="contact_id" value={contact.id} />
                      <button
                        type="submit"
                        className="text-brand-muted hover:text-red-500 transition-colors text-xs"
                      >
                        削除
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <p className="text-brand-muted text-sm mb-4">担当者が登録されていません</p>
      )}

      {/* 追加フォーム */}
      {showForm ? (
        <ContactForm
          action={async (formData) => {
            await addContactAction(formData);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
          submitLabel="追加"
        />
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

function ContactForm({
  contact,
  action,
  onCancel,
  submitLabel,
}: {
  contact?: CaseContact;
  action: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
      {contact && <input type="hidden" name="contact_id" value={contact.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-brand-muted mb-1">名前 <span className="text-red-400">*</span></label>
          <input name="contact_name" required defaultValue={contact?.name || ''} className="form-input" placeholder="山田太郎" />
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">読み</label>
          <input name="contact_name_reading" defaultValue={contact?.name_reading || ''} className="form-input" placeholder="やまだたろう" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-brand-muted mb-1">役職</label>
          <input name="contact_role" defaultValue={contact?.role || ''} className="form-input" placeholder="代表 / 担当者" />
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">部門・組織名</label>
          <input name="contact_department" defaultValue={contact?.department || ''} className="form-input" placeholder="実行委員会 / 広報部" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-brand-muted mb-1">連絡手段</label>
          <select name="contact_method" defaultValue={contact?.contact_method || ''} className="form-input">
            <option value="">未設定</option>
            <option value="Email">Email</option>
            <option value="Instagram DM">Instagram DM</option>
            <option value="LINE">LINE</option>
            <option value="電話">電話</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">連絡先</label>
          <input name="contact_info" defaultValue={contact?.contact_info || ''} className="form-input" placeholder="メアド / ID" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-brand-muted mb-1">メモ</label>
        <textarea name="contact_memo" rows={2} defaultValue={contact?.memo || ''} className="form-input" placeholder="自由にメモ" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <SubmitButton
          label={submitLabel}
          pendingLabel={`${submitLabel}中...`}
          className="px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors active:scale-[0.98] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-xs text-brand-muted hover:text-brand-text transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
