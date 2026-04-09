// Базовый URL backend API для всех запросов.
const API = "http://localhost:4000/api";

// Универсальная обёртка для fetch-запросов к backend.
// Принимает путь, метод, тело и токен авторизации.
export async function apiFetch(path, { method = "GET", body, token } = {}) {
  // Формируем заголовки запроса с типом контента JSON.
  const headers = { "Content-Type": "application/json" };
  // Если передан JWT-токен, добавляем его в заголовок Authorization.
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Выполняем HTTP-запрос к backend по указанному пути.
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    // Сериализуем тело запроса в JSON, если оно передано.
    body: body ? JSON.stringify(body) : undefined,
  });

  // Пытаемся распарсить JSON-ответ (может быть пустым при ошибках).
  const json = await res.json().catch(() => null);
  // Если статус ответа не 2xx, выбрасываем ошибку с сообщением от сервера.
  if (!res.ok) {
    const msg = json?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return json?.data ?? json;
}

export async function apiUpload(path, { file, fieldName = "file", token } = {}) {
  const formData = new FormData();
  formData.append(fieldName, file);

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return json?.data ?? json;
}
