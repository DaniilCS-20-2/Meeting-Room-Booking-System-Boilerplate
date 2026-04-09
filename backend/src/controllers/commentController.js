// Импортируем репозиторий комментариев для доступа к данным.
const CommentRepository = require("../models/commentRepository");
// Импортируем типизированную HTTP-ошибку.
const HttpError = require("../utils/httpError");

// Контроллер получения комментариев к комнате.
const getByRoom = async (req, res, next) => {
  try {
    // Получаем комментарии по id комнаты из параметров URL.
    const comments = await CommentRepository.findByRoom(req.params.roomId);
    // Возвращаем 200 с массивом комментариев.
    res.json({ success: true, data: comments });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер создания нового комментария к комнате.
const create = async (req, res, next) => {
  try {
    // Проверяем обязательное поле message.
    if (!req.body.message) throw new HttpError(400, "Message is required.");
    // Создаём комментарий с привязкой к комнате и автору.
    const comment = await CommentRepository.create({
      roomId: req.params.roomId,
      userId: req.user.id,
      message: req.body.message,
    });
    // Возвращаем 201 Created с данными созданного комментария.
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер удаления комментария (только для админа).
const remove = async (req, res, next) => {
  try {
    // Удаляем комментарий по id.
    const deleted = await CommentRepository.deleteComment(req.params.id);
    // Если комментарий не найден — 404.
    if (!deleted) throw new HttpError(404, "Comment not found.");
    // Возвращаем 200 с подтверждением удаления.
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Экспортируем контроллеры комментариев.
module.exports = { getByRoom, create, remove };
