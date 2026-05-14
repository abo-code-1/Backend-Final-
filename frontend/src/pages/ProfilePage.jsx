import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Heart,
  Inbox,
  Home as HomeIcon,
  Settings,
  Pencil,
} from "lucide-react";
import { logout } from "../store/authSlice";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import PageHeader from "../components/common/PageHeader";

const ROLE_LABELS = {
  seeker: "Ищу жильё",
  host: "Сдаю жильё",
  admin: "Администратор",
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role } = useSelector((s) => s.auth);

  const onLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  if (!user) return null;

  const initial = user.fullName?.[0]?.toUpperCase() || "U";

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Аккаунт"
        title="Профиль"
        subtitle="Ваши данные, верификация и настройки."
        actions={
          <Link to="/settings">
            <Button variant="outline">
              <Settings size={15} /> Настройки
            </Button>
          </Link>
        }
      />

      <div className="mt-8 grid md:grid-cols-[280px_1fr] gap-8">
        <aside className="space-y-5">
          <div className="rounded-2xl border p-6 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-foreground text-background flex items-center justify-center text-3xl font-bold">
              {initial}
            </div>
            <p className="mt-4 font-semibold">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge className="mt-3">{ROLE_LABELS[role] || role}</Badge>
          </div>

          <nav className="rounded-2xl border divide-y overflow-hidden">
            <ProfileNavLink to="/favorites" icon={Heart} label="Избранное" />
            <ProfileNavLink
              to="/applications"
              icon={Inbox}
              label="Мои заявки"
            />
            {(role === "host" || role === "admin") && (
              <>
                <ProfileNavLink
                  to="/my-listings"
                  icon={HomeIcon}
                  label="Мои объявления"
                />
                <ProfileNavLink
                  to="/applications/received"
                  icon={Inbox}
                  label="Входящие заявки"
                />
              </>
            )}
          </nav>
        </aside>

        <main className="space-y-6">
          <section className="rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Личные данные</h2>
              <Link
                to="/settings"
                className="text-sm font-semibold text-primary inline-flex items-center gap-1"
              >
                <Pencil size={14} /> Изменить
              </Link>
            </div>
            <dl className="grid sm:grid-cols-2 gap-4">
              <Field label="Имя" value={user.fullName} icon={UserIcon} />
              <Field label="Email" value={user.email} icon={Mail} />
              <Field label="Телефон" value={user.phone || "—"} icon={Mail} />
              <Field
                label="Роль"
                value={ROLE_LABELS[role] || role}
                icon={ShieldCheck}
              />
            </dl>
          </section>

          <section className="rounded-2xl border p-6">
            <h2 className="text-lg font-semibold">Верификация</h2>
            <p className="text-sm text-muted-foreground">
              Подтверждённые аккаунты получают больше откликов и доверия.
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <VerifyCard
                title="Email"
                done
                description="Подтверждён при регистрации"
              />
              <VerifyCard
                title="Телефон"
                done={!!user.isPhoneVerified}
                description={
                  user.isPhoneVerified
                    ? "Подтверждён"
                    : "Добавьте номер в настройках"
                }
              />
              <VerifyCard
                title="ID документ"
                done={!!user.isIdVerified}
                description={
                  user.isIdVerified
                    ? "Одобрено администрацией"
                    : "Загрузите скан паспорта"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border p-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Завершить сессию</h3>
              <p className="text-sm text-muted-foreground">
                Вы выйдете из аккаунта на этом устройстве.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onLogout}
              className="text-destructive hover:border-destructive/40"
            >
              <LogOut size={15} /> Выйти
            </Button>
          </section>
        </main>
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
        <Icon size={12} /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function VerifyCard({ title, done, description }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck
          size={16}
          className={done ? "text-success" : "text-muted-foreground"}
        />
        <p className="font-semibold text-sm">{title}</p>
        <Badge
          variant={done ? "success" : "outline"}
          className="ml-auto text-[10px]"
        >
          {done ? "Проверено" : "Ожидает"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ProfileNavLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
    >
      <Icon size={16} className="text-muted-foreground" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
