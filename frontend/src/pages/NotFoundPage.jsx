import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import Button from "../components/common/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="text-[clamp(4rem,12vw,8rem)] font-bold leading-none text-primary tracking-tighter">
        404
      </p>
      <h1 className="text-2xl md:text-3xl font-bold">Страница не найдена</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        Кажется, этот адрес свободен. Попробуйте вернуться на главную или
        поискать жильё.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Button variant="outline">
            <Home size={15} /> На главную
          </Button>
        </Link>
        <Link to="/listings">
          <Button>
            <Search size={15} /> К объявлениям
          </Button>
        </Link>
      </div>
    </div>
  );
}
