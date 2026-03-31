import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Download } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { openAnnouncementPdf, SchoolInfo } from "@/lib/announcementPdf";

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
  const [printing, setPrinting] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInfo>({ name: "Studyzone School" });

  useEffect(() => {
    fetchApi("/ParentPortal/announcements?take=50")
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch school info
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchApi("/Schools/my") as SchoolInfo;
        if (s) setSchool(s);
      } catch (_) {
        // use default
      }
    })();
  }, []);

  const handlePrint = (announcement: AnnouncementDto) => {
    setPrinting(announcement.id);
    try {
      openAnnouncementPdf(announcement, school);
    } finally {
      setTimeout(() => setPrinting(null), 500);
    }
  };

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
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{n.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePrint(n)}
                      disabled={printing === n.id}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {printing === n.id ? "..." : "Download"}
                    </Button>
                  </div>
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