import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

interface AnnouncementDto {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  audienceType?: string;
}

const ParentAnnouncements = () => {
  const [list, setList] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/ParentPortal/announcements?take=50")
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Announcements</h1>
      {loading ? (
        <Card className="rounded-[var(--radius)]"><CardContent className="p-8">Loading...</CardContent></Card>
      ) : list.length === 0 ? (
        <Card className="rounded-[var(--radius)]">
          <CardContent className="p-8 text-center text-muted-foreground">No announcements.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="rounded-[var(--radius)] shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{n.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </CardHeader>
                {n.body && <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{n.body}</p></CardContent>}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentAnnouncements;
