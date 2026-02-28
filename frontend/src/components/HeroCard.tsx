import { motion } from "framer-motion";
import { BookOpen, Award, TrendingUp } from "lucide-react";

export function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl gradient-hero p-8 text-primary-foreground"
    >
      <div className="relative z-10 max-w-lg">
        <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, Admin! 👋</h1>
        <p className="mt-2 text-primary-foreground/80">
          Manage your tuition center efficiently. Track students, fees, and performance all in one place.
        </p>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="flex gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/20 backdrop-blur-sm">
              <BookOpen className="h-10 w-10" />
            </div>
            <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/15 backdrop-blur-sm">
              <Award className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-3 ml-10 flex h-14 w-14 items-center justify-center rounded-xl bg-card/10 backdrop-blur-sm">
            <TrendingUp className="h-7 w-7" />
          </div>
        </motion.div>
      </div>

      {/* Background shapes */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-card/5" />
      <div className="absolute -bottom-8 right-20 h-32 w-32 rounded-full bg-card/5" />
    </motion.div>
  );
}
