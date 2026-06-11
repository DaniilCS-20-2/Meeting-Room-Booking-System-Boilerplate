const BookingRepository = require("../models/bookingRepository");
const HttpError = require("../utils/httpError");

const toDisplayItem = (row) => {
  const guestNames = [row.guest_first_name, row.guest_last_name].filter(Boolean).join(" ").trim() || null;
  const guestNote = (row.guest_description || "").trim() || null;
  return {
    id: row.id,
    roomName: row.room_name,
    startTime: row.start_time,
    endTime: row.end_time,
    companyName: row.company_name || null,
    companyColor: row.company_color || null,
    companyLogoUrl: row.company_logo || null,
    hostName: row.user_name || null,
    guestNames,
    guestNote,
  };
};

// Публичный список встреч на день — для infoskjerm / TV i gangen.
// Query: from, to — ISO-строки границ дня (локальное время клиента).
const getToday = async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    if (!from || !to) {
      throw new HttpError(400, "Parametrane from og to er påkravde.");
    }
    const rows = await BookingRepository.findAllInRange({ from, to });
    const now = Date.now();
    const upcoming = rows.filter((row) => new Date(row.end_time).getTime() > now);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({
      success: true,
      data: upcoming.map(toDisplayItem),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getToday };
