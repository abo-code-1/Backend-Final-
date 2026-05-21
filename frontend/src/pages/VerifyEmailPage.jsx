import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { apiClient } from "../api/client";
import { setUser } from "../store/authSlice";
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
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const verified = Boolean(user?.isEmailVerified);

  const [step, setStep] = useState("request"); // "request" | "enter"
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setSending(true);
    setError("");
    try {
      const { data } = await apiClient.post("/auth/email/request-code");
      setStep("enter");
      if (data.devCode) {
        setCode(data.devCode);
        toast.info(`Тестовый режим: код ${data.devCode}`);
      } else {
        toast.success("Код отправлен на вашу почту");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось отправить код");
    } finally {
      setSending(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Введите 6-значный код");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const { data } = await apiClient.post("/auth/email/verify", { code });
      dispatch(setUser(data.user));
      toast.success("Email подтверждён");
    } catch (e2) {
      setError(e2.response?.data?.message || "Неверный код");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        eyebrow="Безопасность"
        title="Подтверждение email"
        subtitle="Подтвердите адрес электронной почты, чтобы повысить доверие к вашему профилю."
      />

      <div className="mt-8">
        {verified ? (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email подтверждён</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email} — адрес подтверждён. Значок доверия активен.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {step === "request" ? "Получить код" : "Введите код"}
              </CardTitle>
              <CardDescription>
                {step === "request"
                  ? `Мы отправим 6-значный код на ${user?.email || "вашу почту"}.`
                  : `Код отправлен на ${user?.email}. Действует 10 минут.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "request" ? (
                <Button onClick={sendCode} loading={sending}>
                  <Mail className="h-4 w-4" />
                  Отправить код
                </Button>
              ) : (
                <form onSubmit={verify} className="space-y-4">
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
                      onClick={sendCode}
                      loading={sending}
                    >
                      Отправить заново
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
