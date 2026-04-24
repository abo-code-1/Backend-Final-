import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import { cn } from "../../utils/cn";
import { 
  Search, 
  PlusCircle, 
  Heart, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  Home
} from "lucide-react";
import { useState } from "react";

const navLinkClass = ({ isActive }) =>
  cn(
    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
    isActive 
      ? "bg-primary text-primary-foreground font-semibold" 
      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
  );

export default function AppLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, role, user } = useSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const NavItems = () => (
    <>
      <NavLink className={navLinkClass} to="/listings">
        <Search size={18} />
        <span>Объявления</span>
      </NavLink>
      {token && (
        <>
          <NavLink className={navLinkClass} to="/favorites">
            <Heart size={18} />
            <span>Избранное</span>
          </NavLink>
          {(role === "host" || role === "admin") && (
            <NavLink className={navLinkClass} to="/my-listings">
              <PlusCircle size={18} />
              <span>Мои объявления</span>
            </NavLink>
          )}
          {role === "admin" && (
            <NavLink className={navLinkClass} to="/admin">
              <LayoutDashboard size={18} />
              <span>Админ</span>
            </NavLink>
          )}
          <NavLink className={navLinkClass} to="/profile">
            <User size={18} />
            <span>Профиль</span>
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <Home size={22} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Roomie.kz
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItems />
            {token ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-2"
              >
                <LogOut size={18} />
                <span>Выход</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background animate-in slide-in-from-top duration-200">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <NavItems />
              {token ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Выход</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
                  <Link
                    to="/login"
                    className="flex justify-center items-center px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors text-sm font-medium"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="flex justify-center items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {children}
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="bg-primary p-1 rounded">
                  <Home size={18} className="text-primary-foreground" />
                </div>
                <span className="text-lg font-bold tracking-tight">Roomie.kz</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Сообщество для поиска идеального жилья и соседей в Казахстане. 
                Мы делаем совместную аренду проще и безопаснее.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Платформа</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/listings" className="hover:text-primary transition-colors">Поиск жилья</Link></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">Стать хозяиром</Link></li>
                <li><Link to="/help" className="hover:text-primary transition-colors">Как это работает</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Контакты</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@roomie.kz</li>
                <li>Алматы, Казахстан</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2026 Roomie.kz. Все права защищены.</p>
            <div className="flex gap-6">
              <Link to="/terms" className="hover:text-primary transition-colors">Условия</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Конфиденциальность</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
