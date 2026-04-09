import React from "react";

export const ConfirmDialog = ({ title, text, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__text">{text}</p>
        <div className="confirm-dialog__actions">
          <button className="btn" type="button" onClick={onCancel}>Avbryt</button>
          <button className="btn btn--danger" type="button" onClick={onConfirm}>Stadfest</button>
        </div>
      </div>
    </div>
  );
};
