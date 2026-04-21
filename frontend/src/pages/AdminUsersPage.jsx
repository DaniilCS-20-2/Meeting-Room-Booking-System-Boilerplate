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

  const [whitelist, setWhitelist] = useState([]);
  const [newWlEmail, setNewWlEmail] = useState("");
  const [newWlRole, setNewWlRole] = useState("user");
  const [wlError, setWlError] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch("/admin/users", { token }).then(setUsers).catch(() => {});
    apiFetch("/admin/whitelist", { token }).then(setWhitelist).catch(() => {});
  }, [token]);

  const handleWhitelistAdd = async (e) => {
    e.preventDefault();
    setWlError("");
    try {
      const item = await apiFetch("/admin/whitelist", {
        method: "POST",
        token,
        body: { email: newWlEmail.trim(), role: newWlRole },
      });
      setWhitelist((prev) => {
        const without = prev.filter((w) => w.id !== item.id);
        return [item, ...without];
      });
      setNewWlEmail("");
      setNewWlRole("user");
    } catch (err) {
      setWlError(err.message);
    }
  };

  const handleWhitelistRoleChange = async (id, role) => {
    try {
      const updated = await apiFetch(`/admin/whitelist/${id}`, {
        method: "PUT",
        token,
        body: { role },
      });
      setWhitelist((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleWhitelistDelete = (id, email) => {
    setConfirmAction({
      title: "Fjern e-post",
      text: `Fjerne «${email}» frå godkjende e-postar?`,
      action: async () => {
        try {
          await apiFetch(`/admin/whitelist/${id}`, { method: "DELETE", token });
          setWhitelist((prev) => prev.filter((w) => w.id !== id));
        } catch (err) {
          alert(err.message);
        }
        setConfirmAction(null);
      },
    });
  };

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

      <h2 className="subsection-title" style={{ marginTop: 32 }}>{t.admin_whitelist_title}</h2>
      <p className="helper-text">{t.admin_whitelist_hint}</p>

      <form className="whitelist-add" onSubmit={handleWhitelistAdd}>
        <input
          type="email"
          className="form-input"
          placeholder={t.admin_whitelist_email}
          value={newWlEmail}
          onChange={(e) => setNewWlEmail(e.target.value)}
          required
        />
        <select
          className="form-input"
          value={newWlRole}
          onChange={(e) => setNewWlRole(e.target.value)}
        >
          <option value="user">{t.admin_whitelist_role_user}</option>
          <option value="admin">{t.admin_whitelist_role_admin}</option>
        </select>
        <button type="submit" className="btn btn--primary btn--small">{t.admin_whitelist_add}</button>
      </form>
      {wlError && <p className="error-text">{wlError}</p>}

      <div className="whitelist-list">
        {whitelist.length === 0 && <p className="helper-text">{t.admin_whitelist_empty}</p>}
        {whitelist.map((w) => (
          <div key={w.id} className="whitelist-item">
            <span className="whitelist-item__email" title={w.email}>{w.email}</span>
            <div className="whitelist-item__controls">
              <select
                className="form-input whitelist-item__role"
                value={w.role}
                onChange={(e) => handleWhitelistRoleChange(w.id, e.target.value)}
              >
                <option value="user">{t.admin_whitelist_role_user}</option>
                <option value="admin">{t.admin_whitelist_role_admin}</option>
              </select>
              <button
                type="button"
                className="whitelist-item__remove"
                onClick={() => handleWhitelistDelete(w.id, w.email)}
                title={t.admin_whitelist_remove}
                aria-label={t.admin_whitelist_remove}
              >
                ×
              </button>
            </div>
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
