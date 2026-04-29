import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";

const TeacherPlaceholder = ({ title }: { title: string }) => {
  usePageHeaderConfigEffect({ title, description: "This section is not available yet." }, [title]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[var(--radius)] shadow-card">
        <CardContent className="flex items-center justify-center p-8 sm:p-16">
          <p className="text-center text-base text-muted-foreground sm:text-lg">{title} module coming soon...</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeacherPlaceholder;
