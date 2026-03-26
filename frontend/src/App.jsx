// Импортируем React для корневого компонента.
import React from "react";
// Импортируем organism-компонент дашборда бронирований.
import { BookingDashboard } from "./components/organisms/BookingDashboard";

// Корневой компонент frontend-приложения.
const App = () => {
  // Рендерим дашборд как главную страницу.
  return <BookingDashboard />;
};

// Экспортируем App по умолчанию.
export default App;
