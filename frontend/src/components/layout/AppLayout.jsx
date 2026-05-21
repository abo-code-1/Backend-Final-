import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import { cn } from "../../utils/cn";
import {
  Search,
  Menu,
  User,
  Heart,
  MessageCircle,
  Globe,
  LogOut,
  Plus,
  Home as HomeIcon,
  LayoutDashboard,
  Settings,
  Inbox,
  Shield,
  Mail,
  Globe2,
  Send,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-1.5 group">
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 text-primary transition-transform group-hover:scale-105"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16 1c-5 0-8 4-8 8 0 6 7 14 8 15 1-1 8-9 8-15 0-4-3-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
      </svg>
      <span className="text-xl font-bold tracking-tight text-primary">
        roomie
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        .kz
      </span>
    </Link>
  );
}

function QuickSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("district", query.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="hidden md:flex items-center h-12 rounded-full border border-border hover:shadow-card transition-shadow bg-background"
    >
      <button
        type="button"
        onClick={() => navigate("/listings")}
        className="pl-5 pr-4 h-full flex items-center text-sm font-semibold border-r"
      >
        Где
      </button>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по району..."
        className="px-4 w-52 bg-transparent text-sm outline-none"
      />
      <button
        type="submit"
        className="mr-1.5 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-dark transition-colors"
        aria-label="Искать"
      >
        <Search size={16} />
      </button>
    </form>
  );
}

function UserMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, role, user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initial = user?.fullName?.[0]?.toUpperCase() || "R";

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-12 pl-3 pr-2 rounded-full border border-border hover:shadow-card transition-shadow bg-background"
        aria-label="Меню пользователя"
      >
        <Menu size={16} />
        <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
          {token ? initial : <User size={16} />}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card shadow-pop py-2 animate-fade-in z-50">
          {!token ? (
            <>
              <MenuLink to="/register" icon={User} label="Регистрация" bold />
              <MenuLink to="/login" icon={LogOut} label="Войти" />
              <MenuDivider />
              <MenuLink to="/how-it-works" icon={HelpCircle} label="Как это работает" />
              <MenuLink to="/help" icon={Inbox} label="Центр помощи" />
              <MenuLink to="/about" icon={Globe} label="О Roomie" />
            </>
          ) : (
            <>
              <MenuLink to="/messages" icon={MessageCircle} label="Сообщения" bold />
              <MenuLink to="/applications" icon={Inbox} label="Мои заявки" />
              <MenuLink to="/favorites" icon={Heart} label="Избранное" />
              <MenuLink to="/profile" icon={User} label="Профиль" />
              <MenuDivider />
              {(role === "host" || role === "admin") && (
                <>
                  <MenuLink to="/listings/new" icon={Plus} label="Разместить жилье" bold />
                  <MenuLink to="/my-listings" icon={HomeIcon} label="Мои объявления" />
                </>
              )}
              {role === "admin" && (
                <MenuLink to="/admin" icon={LayoutDashboard} label="Админ-панель" />
              )}
              <MenuLink to="/settings" icon={Settings} label="Настройки" />
              <MenuLink to="/help" icon={HelpCircle} label="Помощь" />
              <MenuDivider />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
              >
                <LogOut size={16} /> Выйти
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon: Icon, label, bold }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors",
        bold ? "font-semibold text-foreground" : "text-foreground/90"
      )}
    >
      <Icon size={16} className="text-muted-foreground" />
      {label}
    </Link>
  );
}

function MenuDivider() {
  return <div className="h-px bg-border my-1.5" />;
}

function Header() {
  const { token, role } = useSelector((s) => s.auth);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="container flex items-center justify-between h-20 gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1">
          <HeaderLink to="/listings" label="Жилье" />
          <HeaderLink to="/neighborhoods" label="Районы" />
          <HeaderLink to="/bill-split" label="Калькулятор" />
          <HeaderLink to="/how-it-works" label="Как это работает" />
          {(role === "host" || role === "admin") && (
            <HeaderLink to="/my-listings" label="Мои объявления" />
          )}
        </nav>

        <div className="flex items-center gap-2">
          <QuickSearchBar />
          {(!token || role === "host" || role === "admin") && (
            <Link
              to={token ? "/listings/new" : "/register"}
              className="hidden md:inline-flex items-center text-sm font-semibold px-3 h-10 rounded-full hover:bg-muted transition-colors"
            >
              Сдать жилье
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-3.5 h-10 inline-flex items-center text-sm font-medium rounded-full transition-colors",
          isActive
            ? "bg-foreground text-background"
            : "text-foreground hover:bg-muted"
        )
      }
    >
      {label}
    </NavLink>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-muted/50 border-t">
      <div className="container py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <HomeIcon size={16} className="text-primary-foreground" />
            </div>
            <span className="font-bold">roomie.kz</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Дружная платформа поиска комнат и соседей в Казахстане.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary">
              <Globe2 size={18} />
            </a>
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary">
              <Send size={18} />
            </a>
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary">
              <MessageSquare size={18} />
            </a>
            <a href="mailto:support@roomie.kz" aria-label="Email" className="text-muted-foreground hover:text-primary">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <FooterCol
          title="Поддержка"
          links={[
            { to: "/help", label: "Центр помощи" },
            { to: "/safety", label: "Безопасность" },
            { to: "/contact", label: "Связаться" },
            { to: "/faq", label: "FAQ" },
          ]}
        />
        <FooterCol
          title="Сообщество"
          links={[
            { to: "/blog", label: "Блог и советы" },
            { to: "/neighborhoods", label: "Районы" },
            { to: "/how-it-works", label: "Как это работает" },
          ]}
        />
        <FooterCol
          title="Для хостов"
          links={[
            { to: "/listings/new", label: "Разместить жилье" },
            { to: "/pricing", label: "Цены и тарифы" },
            { to: "/my-listings", label: "Мои объявления" },
          ]}
        />
        <FooterCol
          title="Roomie"
          links={[
            { to: "/about", label: "О нас" },
            { to: "/terms", label: "Условия" },
            { to: "/privacy", label: "Конфиденциальность" },
          ]}
        />
      </div>
      <div className="border-t">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <p>© 2026 Roomie.kz · Алматы, Казахстан</p>
          <p className="flex items-center gap-4">
            <span>₸ KZT</span>
            <span>·</span>
            <span>Русский (RU)</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main
        className={cn(
          "flex-1",
          isHome ? "" : isAuthPage ? "py-0" : "container py-8 md:py-12"
        )}
      >
        {isHome ? children : children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
