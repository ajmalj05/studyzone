import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const TeacherPlaceholder = ({ title }: { title: string }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h1 className="text-lg font-semibold text-foreground mb-4">{title}</h1>
    <Card className="rounded-[var(--radius)] shadow-card">
      <CardContent className="flex items-center justify-center p-16">
        <p className="text-muted-foreground text-lg">{title} module coming soon...</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default TeacherPlaceholder;
