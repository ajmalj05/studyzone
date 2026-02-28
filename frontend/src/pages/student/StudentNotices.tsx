import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import { getStudentMenu } from "@/config/studentMenu";

interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = (await fetchApi("/Portal/notices?take=50")) as Notice[];
        setNotices(Array.isArray(list) ? list : []);
      } catch (_) {
        setNotices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Notices</h1>
        {loading ? (
          <Card><CardContent className="p-8">Loading...</CardContent></Card>
        ) : notices.length === 0 ? (
          <Card><CardContent className="p-8 text-muted-foreground">No notices.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  </CardHeader>
                  {n.body && <CardContent className="pt-0"><p className="text-sm text-foreground/90">{n.body}</p></CardContent>}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
