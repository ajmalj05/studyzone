import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary">
        <Construction className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">This module is coming soon!</p>
    </motion.div>
  );
}
