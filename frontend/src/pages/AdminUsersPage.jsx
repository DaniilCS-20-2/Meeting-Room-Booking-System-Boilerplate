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

  const [companies, setCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyColor, setNewCompanyColor] = useState("#3b82f6");
  const [companyError, setCompanyError] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch("/admin/users", { token }).then(setUsers).catch(() => {});
    apiFetch("/admin/whitelist", { token }).then(setWhitelist).catch(() => {});
    apiFetch("/admin/companies", { token }).then(setCompanies).catch(() => {});
  }, [token]);

  const handleCompanyAdd = async (e) => {
    e.preventDefault();
    setCompanyError("");
    try {
      const item = await apiFetch("/admin/companies", {
        method: "POST", token,
        body: { name: newCompanyName.trim(), color: newCompanyColor },
      });
      setCompanies((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCompanyName("");
      setNewCompanyColor("#3b82f6");
    } catch (err) {
      setCompanyError(err.message);
    }
  };

  const handleCompanyUpdate = async (id, patch) => {
    try {
      const updated = await apiFetch(`/admin/companies/${id}`, {
        method: "PUT", token, body: patch,
      });
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompanyDelete = (id, name) => {
    setConfirmAction({
      title: "Slett selskap",
      text: `Slett selskapet «${name}»? Brukarar vil miste tilknytinga.`,
      action: async () => {
        try {
          await apiFetch(`/admin/companies/${id}`, { method: "DELETE", token });
          setCompanies((prev) => prev.filter((c) => c.id !== id));
          setUsers((prev) => prev.map((u) => (u.company_id === id
            ? { ...u, company_id: null, company_name: null, company_color: null }
            : u)));
        } catch (err) {
          alert(err.message);
        }
        setConfirmAction(null);
      },
    });
  };

  const handleUserCompanyChange = async (userId, companyId) => {
    try {
      const updated = await apiFetch(`/admin/users/${userId}/company`, {
        method: "PUT", token,
        body: { companyId: companyId || null },
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      alert(err.message);
    }
  };

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
                  <span
                    className="user-item__company-chip"
                    style={{
                      background: u.company_color || "#94a3b8",
                      color: "#fff",
                    }}
                    title={u.company_name || t.company_none}
                  >
                    {u.company_name || t.company_none}
                  </span>
                </div>
                <div className="user-item__actions">
                  <select
                    className="form-input user-item__company-select"
                    value={u.company_id || ""}
                    onChange={(e) => handleUserCompanyChange(u.id, e.target.value)}
                    title={t.admin_users_company}
                  >
                    <option value="">{t.company_none}</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
              className="btn btn--small btn--danger whitelist-item__remove"
              onClick={() => handleWhitelistDelete(w.id, w.email)}
            >
              {t.admin_whitelist_remove}
            </button>
          </div>
        ))}
      </div>

      <h2 className="subsection-title" style={{ marginTop: 32 }}>{t.admin_companies_title}</h2>
      <p className="helper-text">{t.admin_companies_hint}</p>

      <form className="whitelist-add" onSubmit={handleCompanyAdd}>
        <input
          type="text"
          className="form-input"
          placeholder={t.admin_companies_name}
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          required
        />
        <input
          type="color"
          className="form-input company-color-input"
          value={newCompanyColor}
          onChange={(e) => setNewCompanyColor(e.target.value)}
          title={t.admin_companies_color}
        />
        <button type="submit" className="btn btn--primary btn--small">{t.admin_companies_add}</button>
      </form>
      {companyError && <p className="error-text">{companyError}</p>}

      <div className="whitelist-list">
        {companies.length === 0 && <p className="helper-text">{t.admin_companies_empty}</p>}
        {companies.map((c) => (
          <div key={c.id} className="whitelist-item">
            <span
              className="company-dot"
              style={{ background: c.color }}
              title={c.color}
            />
            <input
              type="text"
              className="form-input whitelist-item__email"
              defaultValue={c.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== c.name) handleCompanyUpdate(c.id, { name });
              }}
            />
            <input
              type="color"
              className="form-input company-color-input whitelist-item__role"
              defaultValue={c.color}
              onChange={(e) => handleCompanyUpdate(c.id, { color: e.target.value })}
              title={t.admin_companies_color}
            />
            <button
              type="button"
              className="btn btn--small btn--danger whitelist-item__remove"
              onClick={() => handleCompanyDelete(c.id, c.name)}
            >
              {t.admin_companies_remove}
            </button>
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
