import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft, Save, KeyRound } from "lucide-react";
import { updateProfileThunk } from "../store/authSlice";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Textarea from "../components/common/Textarea";
import PageHeader from "../components/common/PageHeader";

const GENDER_OPTIONS = [
  { value: "", label: "Не указан" },
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
  { value: "other", label: "Другой" },
];

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    gender: user?.gender || "",
    occupation: user?.occupation || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdError, setPwdError] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  if (!user) return null;

  const onProfileField = (key) => (e) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }));

  const onPwdField = (key) => (e) => {
    setPwd((p) => ({ ...p, [key]: e.target.value }));
    setPwdError("");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (profile.fullName.trim().length < 2) {
      toast.error("Имя слишком короткое");
      return;
    }
    setSavingProfile(true);
    try {
      await dispatch(
        updateProfileThunk({
          fullName: profile.fullName.trim(),
          bio: profile.bio.trim(),
          gender: profile.gender || undefined,
          occupation: profile.occupation.trim(),
          avatarUrl: profile.avatarUrl.trim(),
        })
      ).unwrap();
    } catch {
      /* toast handled in slice */
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      setPwdError("Пароли не совпадают");
      return;
    }
    if (pwd.newPassword.length < 8) {
      setPwdError("Пароль должен быть не короче 8 символов");
      return;
    }
    setSavingPwd(true);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      toast.success("Пароль изменён");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const message =
        err.response?.data?.message || "Не удалось изменить пароль";
      setPwdError(message);
      toast.error(message);
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Аккаунт"
        title="Настройки"
        subtitle="Управление личными данными и безопасностью аккаунта."
        actions={
          <Link to="/profile">
            <Button variant="outline">
              <ArrowLeft size={15} /> К профилю
            </Button>
          </Link>
        }
      />

      <div className="mt-8 space-y-6">
        <form
          onSubmit={saveProfile}
          className="rounded-2xl border p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold">Личные данные</h2>
            <p className="text-sm text-muted-foreground">
              Эта информация видна хозяевам, когда вы откликаетесь на жильё.
            </p>
          </div>

          <Input
            label="Имя"
            value={profile.fullName}
            onChange={onProfileField("fullName")}
            placeholder="Иван Иванов"
            required
          />

          <Textarea
            label="О себе"
            value={profile.bio}
            onChange={onProfileField("bio")}
            placeholder="Пара слов о вас, привычках и образе жизни..."
            rows={4}
            hint="До 500 символов"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid w-full gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Пол
              </label>
              <select
                value={profile.gender}
                onChange={onProfileField("gender")}
                className="flex h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Род занятий"
              value={profile.occupation}
              onChange={onProfileField("occupation")}
              placeholder="Например: студент, дизайнер"
            />
          </div>

          <Input
            label="Ссылка на аватар"
            value={profile.avatarUrl}
            onChange={onProfileField("avatarUrl")}
            placeholder="https://..."
            hint="Оставьте пустым, чтобы убрать фото"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile} disabled={savingProfile}>
              <Save size={15} /> Сохранить
            </Button>
          </div>
        </form>

        <form
          onSubmit={savePassword}
          className="rounded-2xl border p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold">Смена пароля</h2>
            <p className="text-sm text-muted-foreground">
              После смены пароля другие сессии будут завершены.
            </p>
          </div>

          <Input
            label="Текущий пароль"
            type="password"
            value={pwd.currentPassword}
            onChange={onPwdField("currentPassword")}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <Input
            label="Новый пароль"
            type="password"
            value={pwd.newPassword}
            onChange={onPwdField("newPassword")}
            placeholder="••••••••"
            autoComplete="new-password"
            hint="Минимум 8 символов: буквы верхнего и нижнего регистра, цифра и символ"
            required
          />
          <Input
            label="Повторите новый пароль"
            type="password"
            value={pwd.confirmPassword}
            onChange={onPwdField("confirmPassword")}
            placeholder="••••••••"
            autoComplete="new-password"
            error={pwdError || undefined}
            required
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              loading={savingPwd}
              disabled={savingPwd}
            >
              <KeyRound size={15} /> Изменить пароль
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
