import React from "react";

// variant: "danger" (по умолчанию — для удалений/отмен) или "success" — для подтверждения создания/сохранения.
export const ConfirmDialog = ({ title, text, onConfirm, onCancel, variant = "danger" }) => {
  const confirmClass = variant === "success" ? "btn btn--success" : "btn btn--danger";
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__text">{text}</p>
        <div className="confirm-dialog__actions">
          <button className="btn" type="button" onClick={onCancel}>Avbryt</button>
          <button className={confirmClass} type="button" onClick={onConfirm}>Stadfest</button>
        </div>
      </div>
    </div>
  );
};
