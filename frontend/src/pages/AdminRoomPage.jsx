import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch, apiUpload } from "../api";
import { t } from "../i18n/labels";
import { ConfirmDialog } from "../components/ConfirmDialog";

const API_BASE = "http://localhost:4000";
const toSrc = (url) => (url?.startsWith("/uploads") ? `${API_BASE}${url}` : url);

export const AdminRoomPage = () => {
  const { roomId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!roomId;
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: 6,
    description: "",
    equipment: "",
    minBookingMinutes: 15,
    maxBookingMinutes: 480,
  });
  const [photos, setPhotos] = useState([]);
  const [noMinLimit, setNoMinLimit] = useState(false);
  const [noMaxLimit, setNoMaxLimit] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!isEdit || !token) return;
    apiFetch(`/rooms/${roomId}`, { token }).then((room) => {
      setForm({
        name: room.name || "",
        location: room.location || "",
        capacity: room.capacity || 6,
        description: room.description || "",
        equipment: room.equipment || "",
        minBookingMinutes: room.min_booking_minutes ?? 15,
        maxBookingMinutes: room.max_booking_minutes ?? 480,
      });
      setPhotos(room.photos || []);
      setNoMinLimit(room.min_booking_minutes == null);
      setNoMaxLimit(room.max_booking_minutes == null);
      setIsDisabled(room.is_disabled);
    }).catch(() => {});
  }, [roomId, token, isEdit]);

  const handleChange = (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [e.target.name]: val }));
  };

  const handleAddPhoto = () => {
    if (isEdit) fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isEdit) return;
    setUploading(true);
    setError("");
    try {
      const room = await apiUpload(`/rooms/${roomId}/photo`, { file, fieldName: "photo", token });
      setPhotos(room.photos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (url) => {
    try {
      const room = await apiFetch(`/rooms/${roomId}/photo`, {
        method: "DELETE", token,
        body: { photoUrl: url },
      });
      setPhotos(room.photos || []);
    } catch (err) {
      setError(err.message);
    }
    setConfirmDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      minBookingMinutes: noMinLimit ? null : form.minBookingMinutes,
      maxBookingMinutes: noMaxLimit ? null : form.maxBookingMinutes,
    };
    try {
      if (isEdit) {
        await apiFetch(`/rooms/${roomId}`, { method: "PUT", token, body: payload });
      } else {
        await apiFetch("/rooms", { method: "POST", token, body: payload });
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleDisable = async () => {
    try {
      await apiFetch(`/rooms/${roomId}/disable`, {
        method: "PATCH", token,
        body: { isDisabled: !isDisabled },
      });
      setIsDisabled(!isDisabled);
    } catch (err) {
      alert(err.message);
    }
  };

  const mainPhoto = photos[0] ? toSrc(photos[0]) : null;

  return (
    <section className="page" style={{ maxWidth: 960 }}>
      <h1 className="page__title">{isEdit ? t.admin_room_title_edit : t.admin_room_title_new}</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="admin-room-layout">
        {/* Left: photos */}
        <div className="admin-room-left">
          {isEdit && (
            <>
              <div className="admin-room-main-photo">
                {mainPhoto
                  ? <img src={mainPhoto} alt="" className="admin-room-main-photo__img" />
                  : <div className="admin-room-main-photo__empty" onClick={handleAddPhoto}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16a4 4 0 100-8 4 4 0 000 8z" fill="#bbb"/>
                        <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9z" stroke="#bbb" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <span style={{ color: "#9ca3af", fontSize: 14, marginTop: 6 }}>Legg til bilete</span>
                    </div>}
              </div>
              <div className="admin-photos__thumbs">
                {photos.map((url, i) => (
                  <div key={i} className="admin-photos__thumb">
                    <img src={toSrc(url)} alt="" className="admin-photos__thumb-img" />
                    <button type="button" className="admin-photos__remove"
                      onClick={() => setConfirmDelete(url)} title="Slett bilete">✕</button>
                  </div>
                ))}
                <div className="admin-photos__thumb admin-photos__thumb--add" onClick={handleAddPhoto}>
                  {uploading ? "..." : "+"}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            </>
          )}
        </div>

        {/* Right: form */}
        <form className="form-card admin-room-form" onSubmit={handleSubmit}>
          <label className="form-label">{t.admin_room_name}
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="form-label">{t.admin_room_location}
            <input className="form-input" name="location" value={form.location} onChange={handleChange} />
          </label>
          <label className="form-label">{t.admin_room_capacity}
            <input className="form-input" type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} required />
          </label>
          <label className="form-label">{t.admin_room_description}
            <textarea className="form-input form-textarea" name="description" value={form.description} onChange={handleChange} />
          </label>
          <label className="form-label">{t.admin_room_equipment}
            <input className="form-input" name="equipment" value={form.equipment} onChange={handleChange} />
          </label>
          <div className="admin-room-times">
            <label className="form-label">{t.admin_room_min}
              <div className="admin-room-times__row">
                <input className="form-input" type="number" name="minBookingMinutes"
                  value={noMinLimit ? "" : form.minBookingMinutes}
                  onChange={handleChange} min={1} step={1} disabled={noMinLimit} />
                <label className="checkbox-label">
                  <input type="checkbox" checked={noMinLimit}
                    onChange={(e) => setNoMinLimit(e.target.checked)} />
                  {t.admin_room_no_limit}
                </label>
              </div>
            </label>
            <label className="form-label">{t.admin_room_max}
              <div className="admin-room-times__row">
                <input className="form-input" type="number" name="maxBookingMinutes"
                  value={noMaxLimit ? "" : form.maxBookingMinutes}
                  onChange={handleChange} min={1} step={1} disabled={noMaxLimit} />
                <label className="checkbox-label">
                  <input type="checkbox" checked={noMaxLimit}
                    onChange={(e) => setNoMaxLimit(e.target.checked)} />
                  {t.admin_room_no_limit}
                </label>
              </div>
            </label>
          </div>
          <button className="btn btn--primary btn--full" type="submit">{t.admin_room_save}</button>
          {isEdit && (
            <button className="btn btn--full" type="button" onClick={handleToggleDisable}>
              {isDisabled ? t.admin_room_enable : t.admin_room_disable}
            </button>
          )}
        </form>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Slett bilete"
          text="Er du sikker på at du vil slette dette biletet?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDeletePhoto(confirmDelete)}
        />
      )}
    </section>
  );
};
