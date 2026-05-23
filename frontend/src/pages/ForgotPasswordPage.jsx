import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const { data: res } = await apiClient.post("/auth/forgot-password", data);
    setDevResetUrl(res?.devResetUrl || null);
    setSent(true);
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

        {sent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <MailCheck size={22} />
              <h1 className="text-2xl font-bold tracking-tight">Проверьте почту</h1>
            </div>
            <p className="text-muted-foreground">
              Если аккаунт с таким email существует, мы отправили ссылку для сброса
              пароля. Ссылка действует 30 минут.
            </p>
            {devResetUrl && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm break-all">
                <p className="mb-1 font-semibold text-muted-foreground">
                  Dev-режим: ссылка для сброса
                </p>
                <Link to={devResetUrl.replace(/^.*\/reset-password/, "/reset-password")} className="text-primary">
                  {devResetUrl}
                </Link>
              </div>
            )}
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Вернуться ко входу
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Сброс пароля</h1>
            <p className="mt-2 text-muted-foreground">
              Укажите email — мы отправим ссылку для создания нового пароля.
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

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-12"
                loading={isSubmitting}
              >
                Отправить ссылку
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Вспомнили пароль?{" "}
              <Link to="/login" className="text-primary font-semibold">
                Войти
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
