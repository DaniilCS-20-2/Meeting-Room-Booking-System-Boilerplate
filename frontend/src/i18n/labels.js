// Словарь меток интерфейса — только Nynorsk (норвежский ню-норск).
// Используется для i18n: все тексты UI берутся из этого объекта.
export const t = {
  // ============= Навигация =============
  nav_home: "Hovudside",                     // Главная страница.
  nav_login: "Logg inn",                     // Кнопка входа.
  nav_register: "Registrer",                 // Кнопка регистрации.
  nav_profile: "Profil",                     // Профиль пользователя.
  nav_admin_rooms: "Administrer rom",        // Админ: управление комнатами.
  nav_admin_users: "Administrer brukarar",   // Админ: управление пользователями.
  nav_logout: "Logg ut",                     // Выход из аккаунта.
  nav_settings: "Innstillingar",             // Настройки (в выпадающем меню).

  // ============= Главная страница (незарегистрированный) =============
  home_welcome: "Velkommen til Moteromsbooking",  // Приветственный заголовок.
  home_info: "Book moterom enkelt og raskt. Logg inn eller registrer deg for a kome i gang.",  // Краткое описание сервиса.
  home_login_btn: "Logg inn",                // Кнопка входа на главной.
  home_register_btn: "Registrer deg",        // Кнопка регистрации на главной.

  // ============= Главная страница (авторизованный) =============
  home_title: "Moterom",                     // Заголовок секции комнат.
  room_free: "Ledig",                        // Статус: комната свободна.
  room_busy: "Opptatt",                      // Статус: комната занята.
  room_disabled: "Vedlikehald",              // Статус: комната на обслуживании.
  room_capacity: "Kapasitet",                // Метка: вместимость комнаты.
  room_free_at: "Ledig kl.",                 // Текст: «Свободна с...».
  room_busy_at: "Opptatt fraa kl.",          // Текст: «Занята с...».
  room_add: "Legg til rom",                  // Кнопка: добавить комнату (админ).
  room_edit: "Rediger",                      // Кнопка: редактировать комнату.
  room_delete: "Slett",                      // Кнопка: удалить комнату.
  room_manage_users: "Brukaradministrasjon", // Кнопка: управление пользователями.

  // ============= Страница авторизации =============
  auth_title: "Innlogging og registrering",  // Заголовок страницы авторизации.
  auth_login: "Logg inn",                    // Вкладка: логин.
  auth_register: "Registrer",                // Вкладка: регистрация.
  auth_email: "E-post",                      // Метка: электронная почта.
  auth_password: "Passord",                  // Метка: пароль.
  auth_name: "Namn",                         // Метка: имя (при регистрации).
  auth_domain_hint: "E-post maa vere fraa tillaten domene (t.d. ferma.no).",  // Подсказка: допустимый домен.
  auth_submit_login: "Logg inn",             // Кнопка отправки: логин.
  auth_submit_register: "Opprett konto",     // Кнопка отправки: регистрация.
  auth_verify_title: "Stadfest e-post",      // Заголовок: подтверждение email.
  auth_verify_hint: "Skriv inn 6-sifra koden sendt til e-posten din.",  // Подсказка: введите код.
  auth_verify_btn: "Stadfest",               // Кнопка: подтвердить.
  auth_forgot: "Gløymt passord?",            // Ссылка: забыли пароль.
  auth_forgot_title: "Tilbakestill passord", // Заголовок: сброс пароля.
  auth_forgot_hint: "Skriv inn e-posten din, og vi sender ein 6-sifra kode.",
  auth_forgot_send: "Send kode",             // Кнопка: отправить код.
  auth_forgot_new_password: "Nytt passord",  // Метка: новый пароль.
  auth_forgot_reset: "Tilbakestill",         // Кнопка: сбросить.
  auth_forgot_success: "Passordet er tilbakestilt. Logg inn med det nye passordet.",
  auth_back_to_login: "Tilbake til innlogging",
  auth_loading: "Vent litt...",

  // ============= Страница комнаты =============
  room_details: "Romdetaljar",               // Заголовок: детали комнаты.
  room_book_btn: "Bestill",                  // Кнопка: забронировать.
  room_next_free: "Ledige tider",            // Метка: ближайшие свободные слоты.
  room_pick_time: "Vel tid",                 // Метка: выбрать время.
  room_from: "Fraa",                         // Метка: «От» (начало бронирования).
  room_to: "Til",                            // Метка: «До» (окончание бронирования).
  room_description: "Skildring",             // Метка: описание.
  room_equipment: "Utstyr",                  // Метка: оборудование.
  room_calendar: "Kalender",                 // Заголовок: календарь.
  room_history: "Historikk",                 // Заголовок: история бронирований.
  room_comments: "Kommentarar",              // Заголовок: комментарии.
  room_cancel_booking: "Avbestill",          // Кнопка: отменить бронирование.
  room_comment_placeholder: "Skriv ein kommentar...",
  room_comment_send: "Send",
  room_back: "Tilbake",
  room_sort_time: "Tid",
  room_sort_activity: "Aktivitet",

  // ============= Страница профиля =============
  profile_title: "Profil",                   // Заголовок: профиль.
  profile_name: "Namn",                      // Метка: имя.
  profile_email: "E-post",                   // Метка: email (только чтение).
  profile_avatar: "Profilbilete",            // Метка: фото профиля.
  profile_change_password: "Endra passord",  // Заголовок: смена пароля.
  profile_current_password: "Noeverande passord",  // Метка: текущий пароль.
  profile_new_password: "Nytt passord",      // Метка: новый пароль.
  profile_save: "Lagre",
  profile_logout: "Logg ut",
  profile_code_hint: "Vi har sendt ein stadfestingskode til e-posten din.",
  profile_code: "Stadfestingskode",
  profile_confirm: "Stadfest",
  profile_change_email: "Endre e-post",
  profile_new_email: "Ny e-post",
  profile_password_for_email: "Passord for stadfesting",

  // ============= Админ: страница комнаты =============
  admin_room_title_new: "Nytt rom",          // Заголовок: создание новой комнаты.
  admin_room_title_edit: "Rediger rom",      // Заголовок: редактирование комнаты.
  admin_room_name: "Romnamn",                // Метка: название комнаты.
  admin_room_location: "Plassering",         // Метка: локация.
  admin_room_capacity: "Kapasitet",          // Метка: вместимость.
  admin_room_description: "Skildring",       // Метка: описание.
  admin_room_equipment: "Utstyr",            // Метка: оборудование.
  admin_room_photo: "Bilete-URL",            // Метка: URL фотографии.
  admin_room_min: "Min. booking (min)",
  admin_room_max: "Maks. booking (min)",
  admin_room_no_limit: "Inga grense",
  room_duration_hint_min: "Minimum",
  room_duration_hint_max: "Maksimum",
  room_duration_hint_min_unit: "min",
  admin_room_save: "Lagre rom",              // Кнопка: сохранить комнату.
  admin_room_disable: "Deaktiver rom",       // Кнопка: отключить комнату.
  admin_room_enable: "Aktiver rom",          // Кнопка: включить комнату.

  // ============= Админ: страница пользователей =============
  admin_users_title: "Brukaradministrasjon", // Заголовок: управление пользователями.
  admin_users_name: "Namn",                  // Метка: имя пользователя.
  admin_users_email: "E-post",               // Метка: email пользователя.
  admin_users_role: "Rolle",                 // Метка: роль пользователя.
  admin_users_edit: "Rediger",               // Кнопка: редактировать.
  admin_users_delete: "Slett",               // Кнопка: удалить.
  admin_users_save: "Lagre",                 // Кнопка: сохранить.

  // ============= Админ: whitelist =============
  admin_whitelist_title: "Godkjende e-postar",
  admin_whitelist_hint: "Berre e-postar på denne lista kan registrere seg.",
  admin_whitelist_email: "E-post",
  admin_whitelist_role: "Rolle",
  admin_whitelist_add: "Legg til",
  admin_whitelist_remove: "Fjern",
  admin_whitelist_empty: "Ingen e-postar i lista.",
  admin_whitelist_role_user: "Brukar",
  admin_whitelist_role_admin: "Admin",

  // ============= Компании (selskap) =============
  auth_company: "Selskap",
  auth_company_placeholder: "Vel selskap",
  admin_users_company: "Selskap",
  admin_companies_title: "Selskap",
  admin_companies_hint: "Legg til, endre eller fjern selskap. Fargen vert brukt i kalenderen.",
  admin_companies_name: "Namn",
  admin_companies_color: "Farge",
  admin_companies_add: "Legg til",
  admin_companies_remove: "Fjern",
  admin_companies_save: "Lagre",
  admin_companies_empty: "Ingen selskap enno.",
  company_none: "Utan selskap",
};
