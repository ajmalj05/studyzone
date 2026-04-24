import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Send, Megaphone, Printer } from "lucide-react";
import { openAnnouncementPdf, SchoolInfo } from "@/lib/announcementPdf";

interface ClassDto {
  id: string;
  name: string;
}

interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  audienceType: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
}

export default function CircularPage() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", audienceType: "All", targetId: "" });
  const [school, setSchool] = useState<SchoolInfo>({ name: "Studyzone School" });

  useEffect(() => {
    (async () => {
      try {
        const [cList, aList] = await Promise.all([
          fetchApi("/Classes") as Promise<ClassDto[]>,
          fetchApi("/Announcements?take=100") as Promise<AnnouncementDto[]>,
        ]);
        setClasses(Array.isArray(cList) ? cList : []);
        setAnnouncements(Array.isArray(aList) ? aList : []);
      } catch (_) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const handleSend = async () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Enter a title", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await fetchApi("/Announcements", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          audienceType: form.audienceType,
          targetId: form.audienceType !== "All" && form.audienceType !== "Teachers" && form.audienceType !== "Parents" ? form.targetId || undefined : undefined,
        }),
      });
      toast({ title: "Sent", description: "Announcement published." });
      setForm({ title: "", body: "", audienceType: "All", targetId: "" });
      const aList = (await fetchApi("/Announcements?take=100")) as AnnouncementDto[];
      setAnnouncements(Array.isArray(aList) ? aList : []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Compose circular
          </CardTitle>
          <CardDescription>
            Publish a circular or announcement to all, teachers, parents, a class, or an individual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Circular title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Input
              placeholder="Message body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <SearchableSelect
                value={form.audienceType}
                onValueChange={(v) => setForm((f) => ({ ...f, audienceType: v, targetId: "" }))}
                className="w-40"
                options={[
                  { value: "All", label: "All" },
                  { value: "Teachers", label: "Teachers" },
                  { value: "Parents", label: "Parents" },
                  { value: "Class", label: "Class" },
                  { value: "Individual", label: "Individual" },
                ]}
              />
            </div>
            {(form.audienceType === "Class" || form.audienceType === "Individual") && (
              <div className="space-y-2">
                <Label>{form.audienceType === "Class" ? "Class" : "Target ID"}</Label>
                {form.audienceType === "Class" ? (
                  <SearchableSelect
                    value={form.targetId}
                    onValueChange={(v) => setForm((f) => ({ ...f, targetId: v }))}
                    placeholder="Select class"
                    className="w-48"
                    options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  />
                ) : (
                  <Input
                    placeholder="User or Student ID (GUID)"
                    value={form.targetId}
                    onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
                    className="w-64"
                  />
                )}
              </div>
            )}
            <Button onClick={handleSend} disabled={sending}>
              <Send className="mr-2 h-4 w-4" /> Publish
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notice board</CardTitle>
          <CardDescription>Published circulars and announcements. Visible on portals by audience.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>{a.audienceType}</TableCell>
                    <TableCell>{a.targetName ?? a.targetId ?? "—"}</TableCell>
                    <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePrint(a)}
                        disabled={printing === a.id}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        {printing === a.id ? "Opening..." : "Print PDF"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
