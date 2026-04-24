import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/common/Button";
import { Search, Home, Shield, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../components/common/Card";

export default function HomePage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const features = [
    {
      icon: <Search className="text-blue-500" />,
      title: "Умный поиск",
      description: "Фильтруйте по району, цене, количеству комнат и даже по характеру соседей."
    },
    {
      icon: <Shield className="text-green-500" />,
      title: "Безопасность",
      description: "Верифицированные аккаунты и модерация объявлений для вашего спокойствия."
    },
    {
      icon: <Users className="text-purple-500" />,
      title: "Сообщество",
      description: "Найдите не просто жилье, а идеальных единомышленников для совместной жизни."
    }
  ];

  return (
    <div className="flex flex-col gap-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-20 -mt-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            className="flex-1 text-center lg:text-left space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Новые объявления каждый день
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
              Найдите идеальное <br />
              <span className="text-primary">жилье и соседей</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Roomie.kz — самая удобная платформа для поиска комнат и сожителей в Алматы, Астане и Шымкенте. 
              Живите красиво вместе с идеальными соседями.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start">
              <Link to="/listings">
                <Button size="lg" className="h-14 px-10 text-lg group">
                  Смотреть объявления
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg">
                  Создать объявление
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-10">
              <div>
                <div className="text-2xl font-bold">2k+</div>
                <div className="text-sm text-muted-foreground">Объявлений</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold">5k+</div>
                <div className="text-sm text-muted-foreground">Пользователей</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold">150+</div>
                <div className="text-sm text-muted-foreground">Успешных сделок</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border aspect-square lg:aspect-video bg-white">
              <img 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Beautiful living room"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white">
                  <div className="text-lg font-semibold">Уютная комната в центре Алматы</div>
                  <div className="text-sm opacity-90">120 000 ₸ / месяц</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border z-20 hidden md:block animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Shield size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-bold">Верифицировано</div>
                  <div className="text-xs text-muted-foreground">Безопасная аренда</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Почему выбирают нас?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Мы создали все инструменты для того, чтобы ваш переезд был максимально комфортным.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={item}>
              <Card className="h-full hover:shadow-md transition-shadow group">
                <CardContent className="pt-8 flex flex-col items-center text-center">
                  <div className="p-4 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary rounded-3xl p-10 md:p-20 text-center text-primary-foreground relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold">Готовы найти свой новый дом?</h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl leading-relaxed">
            Присоединяйтесь к тысячам людей, которые уже нашли свое идеальное жилье через Roomie.kz. 
            Это бесплатно и займет всего пару минут.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                Начать сейчас
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
