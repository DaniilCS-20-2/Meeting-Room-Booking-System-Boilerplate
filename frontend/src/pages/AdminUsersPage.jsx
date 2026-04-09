// Импортируем React и необходимые хуки.
import React, { useEffect, useState } from "react";
// Импортируем хук аутентификации.
import { useAuth } from "../context/AuthContext";
// Импортируем обёртку для API-запросов.
import { apiFetch } from "../api";
// Импортируем объект переводов (Nynorsk).
import { t } from "../i18n/labels";

// Админская страница управления пользователями.
export const AdminUsersPage = () => {
  // Получаем токен из контекста аутентификации.
  const { token } = useAuth();
  // State: массив всех пользователей.
  const [users, setUsers] = useState([]);
  // State: id пользователя, находящегося в режиме редактирования.
  const [editingId, setEditingId] = useState(null);
  // State: поля формы редактирования пользователя.
  const [editForm, setEditForm] = useState({ displayName: "", avatarUrl: "" });

  // Загружаем список пользователей при монтировании.
  useEffect(() => {
    // Если нет токена — не загружаем.
    if (!token) return;
    // GET /api/admin/users — получаем всех пользователей.
    apiFetch("/admin/users", { token }).then(setUsers).catch(() => {});
  }, [token]);

  // Обработчик начала редактирования пользователя.
  const handleEdit = (u) => {
    // Устанавливаем id редактируемого пользователя.
    setEditingId(u.id);
    // Заполняем форму текущими данными пользователя.
    setEditForm({ displayName: u.display_name, avatarUrl: u.avatar_url || "" });
  };

  // Обработчик сохранения изменений пользователя.
  const handleSave = async (id) => {
    try {
      // PUT /api/admin/users/:id — обновляем имя и аватар.
      const updated = await apiFetch(`/admin/users/${id}`, {
        method: "PUT", token,
        body: { displayName: editForm.displayName, avatarUrl: editForm.avatarUrl || null },
      });
      // Обновляем пользователя в локальном state без перезагрузки.
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      // Выходим из режима редактирования.
      setEditingId(null);
    } catch (err) {
      // Показываем ошибку через alert.
      alert(err.message);
    }
  };

  // Обработчик удаления пользователя.
  const handleDelete = async (id) => {
    // Запрашиваем подтверждение перед удалением.
    if (!confirm("Slett denne brukaren?")) return;
    try {
      // DELETE /api/admin/users/:id — удаляем пользователя.
      await apiFetch(`/admin/users/${id}`, { method: "DELETE", token });
      // Удаляем пользователя из локального state.
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      // Показываем ошибку через alert.
      alert(err.message);
    }
  };

  return (
    <section className="page">
      {/* Заголовок страницы. */}
      <h1 className="page__title">{t.admin_users_title}</h1>
      {/* Список всех пользователей. */}
      <div className="users-list">
        {users.map((u) => (
          <div key={u.id} className="user-item">
            {/* Если текущий пользователь в режиме редактирования — показываем форму. */}
            {editingId === u.id ? (
              <div className="user-item__edit">
                {/* Поле «Имя». */}
                <input className="form-input" value={editForm.displayName}
                  onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))} placeholder={t.admin_users_name} />
                {/* Поле «URL аватара». */}
                <input className="form-input" value={editForm.avatarUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, avatarUrl: e.target.value }))} placeholder="Avatar URL" />
                {/* Кнопка «Сохранить». */}
                <button className="btn btn--primary btn--small" onClick={() => handleSave(u.id)}>{t.admin_users_save}</button>
                {/* Кнопка «Отмена» — выход из режима редактирования. */}
                <button className="btn btn--small" onClick={() => setEditingId(null)}>Avbryt</button>
              </div>
            ) : (
              <>
                {/* Информация о пользователе. */}
                <div className="user-item__info">
                  {/* Имя (или email, если имя не задано). */}
                  <strong>{u.display_name || u.email}</strong>
                  {/* Email пользователя. */}
                  <span className="user-item__email">{u.email}</span>
                  {/* Роль пользователя (user/admin). */}
                  <span className="user-item__role">{u.role}</span>
                </div>
                {/* Кнопки действий. */}
                <div className="user-item__actions">
                  {/* Кнопка «Редактировать». */}
                  <button className="btn btn--small" onClick={() => handleEdit(u)}>{t.admin_users_edit}</button>
                  {/* Кнопка «Удалить». */}
                  <button className="btn btn--small btn--danger" onClick={() => handleDelete(u.id)}>{t.admin_users_delete}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
