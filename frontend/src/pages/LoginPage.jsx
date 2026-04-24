import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginThunk } from "../store/authSlice";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/common/Card";
import { LogIn, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

const localLoginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль")
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(localLoginSchema)
  });

  const onSubmit = async (data) => {
    const resultAction = await dispatch(loginThunk(data));
    if (loginThunk.fulfilled.match(resultAction)) {
      navigate("/");
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader className="space-y-1 text-center pt-10">
            <CardTitle className="text-3xl font-bold">Вход</CardTitle>
            <CardDescription>
              Введите свои данные для входа в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold" 
                loading={isSubmitting}
              >
                <LogIn className="mr-2" size={20} />
                Войти
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
              Нет аккаунта?{" "}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
