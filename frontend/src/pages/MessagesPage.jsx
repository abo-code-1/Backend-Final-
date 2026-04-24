import { useState } from "react";
import { Send, Search, Phone, Video, MoreVertical } from "lucide-react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import { cn } from "../utils/cn";

const MOCK_THREADS = [
  {
    id: 1,
    name: "Айгерим Б.",
    listing: "Комната в Медеу",
    avatar: "https://i.pravatar.cc/100?img=47",
    last: "Здравствуйте, ещё актуально?",
    unread: 2,
    time: "10:42",
  },
  {
    id: 2,
    name: "Ермек К.",
    listing: "Студия на Абая",
    avatar: "https://i.pravatar.cc/100?img=12",
    last: "Да, конечно, заходите в субботу.",
    unread: 0,
    time: "Вчера",
  },
  {
    id: 3,
    name: "Диана С.",
    listing: "2 комнаты · Есиль",
    avatar: "https://i.pravatar.cc/100?img=32",
    last: "Спасибо! Напишу завтра.",
    unread: 0,
    time: "Пн",
  },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    from: "them",
    text: "Здравствуйте! Ещё актуально ваше предложение?",
    time: "10:30",
  },
  {
    id: 2,
    from: "me",
    text: "Добрый день, да. Вы на какое число планируете заселение?",
    time: "10:35",
  },
  {
    id: 3,
    from: "them",
    text: "С 1 мая. Можно ли посмотреть в субботу?",
    time: "10:40",
  },
  { id: 4, from: "them", text: "И ещё — разрешены ли питомцы?", time: "10:42" },
];

export default function MessagesPage() {
  const [active, setActive] = useState(MOCK_THREADS[0].id);
  const [draft, setDraft] = useState("");

  const thread = MOCK_THREADS.find((t) => t.id === active);

  return (
    <div>
      <PageHeader
        eyebrow="Связь"
        title="Сообщения"
        subtitle="Общайтесь с хостами и жильцами напрямую."
      />

      <div className="mt-8 grid md:grid-cols-[340px_1fr] rounded-2xl border overflow-hidden h-[640px]">
        {/* LIST */}
        <aside className="border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input placeholder="Поиск..." className="pl-9 h-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 text-left border-b hover:bg-muted/40 transition-colors",
                  active === t.id && "bg-muted/60"
                )}
              >
                <img
                  src={t.avatar}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{t.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {t.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.listing}</p>
                  <p className="mt-1 text-sm truncate">{t.last}</p>
                </div>
                {t.unread > 0 && (
                  <span className="shrink-0 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* CONVERSATION */}
        <section className="flex flex-col">
          {/* header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <img
                src={thread.avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{thread.name}</p>
                <p className="text-xs text-muted-foreground">
                  {thread.listing}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <IconButton icon={Phone} />
              <IconButton icon={Video} />
              <IconButton icon={MoreVertical} />
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-muted/20">
            {MOCK_MESSAGES.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                  m.from === "me"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-background border"
                )}
              >
                <p>{m.text}</p>
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    m.from === "me"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {m.time}
                </p>
              </div>
            ))}
          </div>

          {/* input */}
          <form
            className="flex items-center gap-2 p-4 border-t bg-background"
            onSubmit={(e) => {
              e.preventDefault();
              setDraft("");
            }}
          >
            <Input
              placeholder="Напишите сообщение..."
              className="flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" disabled={!draft.trim()}>
              <Send size={16} />
              Отправить
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon }) {
  return (
    <button
      type="button"
      className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
    >
      <Icon size={16} />
    </button>
  );
}
