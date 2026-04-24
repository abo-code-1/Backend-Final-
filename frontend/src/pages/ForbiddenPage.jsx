import { Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import Button from "../components/common/Button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-5">
        <Lock size={28} />
      </div>
      <h1 className="text-3xl font-bold">Нет доступа</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        У вашей роли нет прав просматривать эту страницу.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="outline">
          <ArrowLeft size={15} /> На главную
        </Button>
      </Link>
    </div>
  );
}
