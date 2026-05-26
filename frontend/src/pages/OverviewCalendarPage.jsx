import React from "react";
import { OverviewCalendar } from "../components/OverviewCalendar";
import { useAuth } from "../context/AuthContext";

export const OverviewCalendarPage = () => {
  const { user, token } = useAuth();

  return (
    <section className="page overview-calendar-page">
      <OverviewCalendar
        token={token}
        canSeeDetails={!!user && user.role !== "viewer"}
        fullscreen
      />
    </section>
  );
};
