import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Download } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { openAnnouncementPdf, SchoolInfo } from "@/lib/announcementPdf";

interface AnnouncementDto {
  id: string;
  title: string;
  body?: string;
  audienceType?: string;
  createdAt: string;
}

const TeacherNotices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInfo>({ name: "Studyzone School" });

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }
    fetchApi(`/Announcements/notice-board?userId=${encodeURIComponent(user._id)}&take=50`)
      .then((list: AnnouncementDto[]) => setNotices(Array.isArray(list) ? list : []))
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [user?._id]);

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
        <h1 className="text-lg font-semibold text-foreground">Notices</h1>

        {loading && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && notices.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No notices.</CardContent></Card>
        )}

        {!loading && !error && notices.length > 0 && (
          <div className="space-y-3">
            {notices.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="rounded-[var(--radius)] shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Bell className="h-4 w-4 text-primary" /> {n.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </p>
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
                  {n.body && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
};

export default TeacherNotices;