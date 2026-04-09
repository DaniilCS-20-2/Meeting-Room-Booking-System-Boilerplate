import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";
import { t } from "../i18n/labels";
import { ConfirmDialog } from "../components/ConfirmDialog";

export const AdminUsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: "", avatarUrl: "" });
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!token) return;
    apiFetch("/admin/users", { token }).then(setUsers).catch(() => {});
  }, [token]);

  const handleEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ displayName: u.display_name, avatarUrl: u.avatar_url || "" });
  };

  const handleSave = async (id) => {
    try {
      const updated = await apiFetch(`/admin/users/${id}`, {
        method: "PUT", token,
        body: { displayName: editForm.displayName, avatarUrl: editForm.avatarUrl || null },
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmAction({
      title: "Slett brukar",
      text: `Er du sikker på at du vil slette «${name}»?`,
      action: async () => {
        try {
          await apiFetch(`/admin/users/${id}`, { method: "DELETE", token });
          setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (err) {
          alert(err.message);
        }
        setConfirmAction(null);
      },
    });
  };

  return (
    <section className="page">
      <h1 className="page__title">{t.admin_users_title}</h1>
      <div className="users-list">
        {users.map((u) => (
          <div key={u.id} className="user-item">
            {editingId === u.id ? (
              <div className="user-item__edit">
                <input className="form-input" value={editForm.displayName}
                  onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))} placeholder={t.admin_users_name} />
                <input className="form-input" value={editForm.avatarUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, avatarUrl: e.target.value }))} placeholder="Avatar URL" />
                <button className="btn btn--primary btn--small" onClick={() => handleSave(u.id)}>{t.admin_users_save}</button>
                <button className="btn btn--small" onClick={() => setEditingId(null)}>Avbryt</button>
              </div>
            ) : (
              <>
                <div className="user-item__info">
                  <strong>{u.display_name || u.email}</strong>
                  <span className="user-item__email">{u.email}</span>
                  <span className="user-item__role">{u.role}</span>
                </div>
                <div className="user-item__actions">
                  <button className="btn btn--small" onClick={() => handleEdit(u)}>{t.admin_users_edit}</button>
                  <button className="btn btn--small btn--danger" onClick={() => handleDelete(u.id, u.display_name || u.email)}>{t.admin_users_delete}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          text={confirmAction.text}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </section>
  );
};
