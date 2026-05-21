import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, ShieldCheck } from "lucide-react";
import { apiClient } from "../api/client";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/common/Card";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail =
    location.state?.email ||
    new URLSearchParams(location.search).get("email") ||
    "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [sentOnce, setSentOnce] = useState(false);
  const autoSent = useRef(false);

  const sendCode = async (silent = false) => {
    if (!email) {
      setError("Введите email");
      return;
    }
    setSending(true);
    setError("");
    try {
      const { data } = await apiClient.post("/auth/email/request-code", { email });
      setSentOnce(true);
      if (data.devCode) {
        setCode(data.devCode);
        toast.info(`Тестовый режим: код ${data.devCode}`);
      } else if (!silent) {
        toast.success("Код отправлен на почту");
      }
    } catch (e) {
      if (!silent) toast.error(e.response?.data?.message || "Не удалось отправить код");
    } finally {
      setSending(false);
    }
  };

  // Auto-send a code when we already know the email (arriving from register/login).
  useEffect(() => {
    if (initialEmail && !autoSent.current) {
      autoSent.current = true;
      sendCode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Введите 6-значный код");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      await apiClient.post("/auth/email/verify", { email, code });
      toast.success("Email подтверждён! Теперь войдите в аккаунт.");
      navigate("/login", { state: { email } });
    } catch (e2) {
      setError(e2.response?.data?.message || "Неверный код");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        eyebrow="Шаг 2 из 3"
        title="Подтверждение email"
        subtitle="Введите код из письма, чтобы активировать аккаунт. После этого вы сможете войти."
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Введите код
            </CardTitle>
            <CardDescription>
              {email
                ? `Код отправлен на ${email}. Действует 10 минут.`
                : "Укажите email, на который зарегистрирован аккаунт."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={verify} className="space-y-4">
              {!initialEmail && (
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  onChange={(ev) => setEmail(ev.target.value)}
                />
              )}
              <Input
                label="Код подтверждения"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="______"
                value={code}
                error={error || undefined}
                onChange={(ev) =>
                  setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="tracking-[0.5em] text-center text-lg font-semibold"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" loading={verifying}>
                  Подтвердить
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => sendCode(false)}
                  loading={sending}
                >
                  <Mail className="h-4 w-4" />
                  {sentOnce ? "Отправить заново" : "Отправить код"}
                </Button>
              </div>
            </form>

            <p className="mt-4 text-sm text-muted-foreground">
              Уже подтвердили?{" "}
              <Link to="/login" className="text-primary font-semibold">
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
