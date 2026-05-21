import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { loginThunk } from "../store/authSlice";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await dispatch(loginThunk(data));
    if (loginThunk.fulfilled.match(result)) {
      navigate("/");
    } else if (result.payload?.code === "EMAIL_NOT_VERIFIED") {
      // Not verified yet — route them to confirm their email first.
      navigate("/verify-email", {
        state: { email: result.payload.email || data.email },
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2">
      {/* LEFT: form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft size={14} /> На главную
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">
            С возвращением 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Войдите, чтобы продолжить поиск идеальных соседей.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-[38px] text-muted-foreground"
              />
              <Input
                label="Email"
                placeholder="you@example.com"
                className="pl-10"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-[38px] text-muted-foreground"
              />
              <Input
                label="Пароль"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-primary" />
                <span>Запомнить меня</span>
              </label>
              <Link to="/help" className="text-primary font-semibold">
                Забыли пароль?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12"
              loading={isSubmitting}
            >
              <LogIn size={16} /> Войти
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            или
            <span className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link to="/register" className="text-primary font-semibold">
              Зарегистрироваться
            </Link>
          </p>
        </motion.div>
      </div>

      {/* RIGHT: visual */}
      <div className="hidden lg:block relative overflow-hidden bg-muted">
        <img
          src="https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative h-full p-12 flex flex-col justify-end text-white">
          <h2 className="text-3xl font-bold leading-tight max-w-md">
            Найдите комнату и людей, с которыми захочется жить.
          </h2>
          <p className="mt-3 text-white/80 max-w-md">
            Тысячи проверенных объявлений в Алматы, Астане и Шымкенте.
          </p>
        </div>
      </div>
    </div>
  );
}
