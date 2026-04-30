import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowLeft,
  Home,
  Key,
} from "lucide-react";
import { registerThunk } from "../store/authSlice";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { cn } from "../utils/cn";

const schema = z.object({
  fullName: z.string().min(2, "Введите полное имя"),
  email: z.string().email("Введите корректный email"),
  password: z
    .string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .max(128, "Пароль слишком длинный")
    .refine((v) => /[a-z]/.test(v), "Пароль должен содержать строчную букву")
    .refine((v) => /[A-Z]/.test(v), "Пароль должен содержать заглавную букву")
    .refine((v) => /[0-9]/.test(v), "Пароль должен содержать цифру")
    .refine((v) => /[^A-Za-z0-9]/.test(v), "Пароль должен содержать символ"),
  phone: z.string().optional(),
  role: z.enum(["seeker", "host"], { required_error: "Выберите роль" }),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "seeker" },
  });

  const role = watch("role");

  const onSubmit = async (data) => {
    const result = await dispatch(registerThunk(data));
    if (registerThunk.fulfilled.match(result)) navigate("/");
  };

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-muted order-2">
        <img
          src="https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative h-full p-12 flex flex-col justify-end text-white">
          <h2 className="text-3xl font-bold leading-tight max-w-md">
            Присоединяйтесь к Roomie
          </h2>
          <p className="mt-3 text-white/80 max-w-md">
            5000+ пользователей уже нашли жильё и соседей через нашу платформу.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 order-1">
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
            Создать аккаунт
          </h1>
          <p className="mt-2 text-muted-foreground">
            Бесплатно. Без комиссий. Пару минут — и вы в деле.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <RoleCard
                active={role === "seeker"}
                onClick={() => setValue("role", "seeker")}
                icon={Key}
                title="Ищу жильё"
                subtitle="Seeker"
              />
              <RoleCard
                active={role === "host"}
                onClick={() => setValue("role", "host")}
                icon={Home}
                title="Сдаю жильё"
                subtitle="Host"
              />
            </div>

            <div className="relative">
              <UserIcon
                size={16}
                className="absolute left-3.5 top-[38px] text-muted-foreground"
              />
              <Input
                label="ФИО"
                placeholder="Иван Иванов"
                className="pl-10"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
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
                <Phone
                  size={16}
                  className="absolute left-3.5 top-[38px] text-muted-foreground"
                />
                <Input
                  label="Телефон"
                  placeholder="+7 777 ..."
                  className="pl-10"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>
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
                hint="8+ символов: строчная, заглавная, цифра, символ"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12"
              loading={isSubmitting}
            >
              <UserPlus size={16} /> Создать аккаунт
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Создавая аккаунт, вы принимаете{" "}
              <Link to="/terms" className="underline">
                условия
              </Link>{" "}
              и{" "}
              <Link to="/privacy" className="underline">
                политику конфиденциальности
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary font-semibold">
              Войти
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon: Icon, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
        active
          ? "border-foreground bg-foreground/5"
          : "border-border hover:border-foreground/40"
      )}
    >
      <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
      <p className="mt-3 font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}
