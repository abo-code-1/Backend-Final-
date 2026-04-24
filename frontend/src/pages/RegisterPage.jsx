import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerThunk } from "../store/authSlice";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/common/Card";
import { UserPlus, Mail, Lock, User as UserIcon, Phone, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const localRegisterSchema = z.object({
  fullName: z.string().min(2, "Введите полное имя"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  phone: z.string().optional(),
  role: z.enum(["seeker", "host"], { required_error: "Выберите роль" })
});

const roleOptions = [
  { label: "Я ищу жилье (Seeker)", value: "seeker" },
  { label: "Я сдаю жилье (Host)", value: "host" },
];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(localRegisterSchema),
    defaultValues: {
      role: "seeker"
    }
  });

  const onSubmit = async (data) => {
    const resultAction = await dispatch(registerThunk(data));
    if (registerThunk.fulfilled.match(resultAction)) {
      navigate("/");
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader className="space-y-1 text-center pt-10">
            <CardTitle className="text-3xl font-bold tracking-tight">Регистрация</CardTitle>
            <CardDescription>
              Присоединяйтесь к нашему сообществу сегодня
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative md:col-span-2">
                <UserIcon className="absolute left-3 top-9 text-muted-foreground" size={18} />
                <Input
                  label="ФИО"
                  placeholder="Иван Иванов"
                  className="pl-10"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-9 text-muted-foreground" size={18} />
                <Input
                  label="Email"
                  placeholder="name@example.com"
                  className="pl-10"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-9 text-muted-foreground" size={18} />
                <Input
                  label="Телефон"
                  placeholder="+7 (___) ___"
                  className="pl-10"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>

              <div className="relative md:col-span-2">
                <Lock className="absolute left-3 top-9 text-muted-foreground" size={18} />
                <Input
                  label="Пароль"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>

              <div className="relative md:col-span-2">
                <UserCheck className="absolute left-3 top-9 text-muted-foreground" size={18} />
                <Select
                  label="Кто вы?"
                  className="pl-10"
                  options={roleOptions}
                  error={errors.role?.message}
                  {...register("role")}
                />
              </div>

              <Button 
                type="submit" 
                className="md:col-span-2 w-full h-12 text-lg font-bold" 
                loading={isSubmitting}
              >
                <UserPlus className="mr-2" size={20} />
                Создать аккаунт
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-10">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Или</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
