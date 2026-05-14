import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Smartphone, RefreshCw } from "lucide-react";
import {
  sendPhoneOtpThunk,
  verifyPhoneOtpThunk,
} from "../store/authSlice";
import Button from "../components/common/Button";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 30;

const maskPhone = (phone) => {
  if (!phone) return "";
  // +77001234567 -> +7 700 ***-**-67
  const m = phone.match(/^(\+\d{1,3})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!m) return phone;
  return `${m[1]} ${m[2]} ***-**-${m[5]}`;
};

export default function VerifyPhonePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  // If the user is already verified, bounce home.
  useEffect(() => {
    if (user?.isPhoneVerified) navigate("/", { replace: true });
  }, [user, navigate]);

  // Tick the resend cooldown down.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Focus first input on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH && /^\d+$/.test(code);

  const setDigitAt = (idx, value) => {
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleChange = (idx, raw) => {
    const v = raw.replace(/\D/g, "");
    if (!v) {
      setDigitAt(idx, "");
      return;
    }
    if (v.length === 1) {
      setDigitAt(idx, v);
      if (idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
    } else {
      // Pasted multi-character — distribute from idx onward.
      const chars = v.slice(0, OTP_LENGTH - idx).split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => {
          next[idx + i] = c;
        });
        return next;
      });
      const last = Math.min(idx + chars.length, OTP_LENGTH - 1);
      inputsRef.current[last]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const chars = text.slice(0, OTP_LENGTH).split("");
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = chars[i] ?? "";
      }
      return next;
    });
    const last = Math.min(chars.length - 1, OTP_LENGTH - 1);
    inputsRef.current[last]?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setSubmitting(true);
    const result = await dispatch(verifyPhoneOtpThunk({ code }));
    setSubmitting(false);
    if (verifyPhoneOtpThunk.fulfilled.match(result)) {
      navigate("/", { replace: true });
    } else {
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const result = await dispatch(sendPhoneOtpThunk());
    setResending(false);
    if (sendPhoneOtpThunk.fulfilled.match(result)) {
      setCooldown(RESEND_COOLDOWN_S);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2">
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

          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-foreground/5 mb-6">
            <Smartphone size={22} className="text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Подтвердите номер
          </h1>
          <p className="mt-2 text-muted-foreground">
            Мы отправили 6-значный код на{" "}
            <span className="font-semibold text-foreground">
              {maskPhone(user?.phone)}
            </span>
            . Введите его ниже, чтобы продолжить.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <div
              className="flex justify-between gap-2"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-border rounded-xl bg-background focus:border-foreground focus:outline-none transition-colors"
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12"
              loading={submitting}
              disabled={!isComplete || submitting}
            >
              <ShieldCheck size={16} /> Подтвердить
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Не получили код?{" "}
              <button
                type="button"
                onClick={onResend}
                disabled={cooldown > 0 || resending}
                className="inline-flex items-center gap-1 font-semibold text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={resending ? "animate-spin" : ""}
                />
                {cooldown > 0
                  ? `Отправить снова (${cooldown}с)`
                  : "Отправить снова"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-xs text-muted-foreground text-center">
            Подтверждение номера повышает доверие к вашему профилю и
            необходимо, чтобы откликаться на объявления.
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-muted">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative h-full p-12 flex flex-col justify-end text-white">
          <h2 className="text-3xl font-bold leading-tight max-w-md">
            Безопасность — на первом месте
          </h2>
          <p className="mt-3 text-white/80 max-w-md">
            Каждый пользователь Roomie проходит SMS-верификацию, чтобы вы могли
            быть уверены, что общаетесь с реальными людьми.
          </p>
        </div>
      </div>
    </div>
  );
}
