import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Lock, ArrowLeft } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

// Mirrors the backend passwordSchema so users get instant feedback.
const schema = z
  .object({
    password: z
      .string()
      .min(8, "Минимум 8 символов")
      .regex(/[a-z]/, "Нужна строчная буква")
      .regex(/[A-Z]/, "Нужна заглавная буква")
      .regex(/[0-9]/, "Нужна цифра")
      .regex(/[^A-Za-z0-9]/, "Нужен спецсимвол"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: data.password,
      });
      toast.success("Пароль обновлён. Теперь войдите с новым паролем.");
      navigate("/login");
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось сбросить пароль");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft size={14} /> Ко входу
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Новый пароль</h1>
        <p className="mt-2 text-muted-foreground">
          Придумайте новый пароль для вашего аккаунта.
        </p>

        {!token ? (
          <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Ссылка недействительна или неполная. Запросите сброс пароля заново.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-[38px] text-muted-foreground"
              />
              <Input
                label="Новый пароль"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-[38px] text-muted-foreground"
              />
              <Input
                label="Повторите пароль"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                error={errors.confirm?.message}
                {...register("confirm")}
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12"
              loading={isSubmitting}
            >
              Сохранить пароль
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="text-primary font-semibold">
            Запросить новую ссылку
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
