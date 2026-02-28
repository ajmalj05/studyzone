import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Send, Megaphone } from "lucide-react";

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

export default function Communication() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audienceType: "All", targetId: "" });

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
          targetId: form.audienceType !== "All" ? form.targetId || undefined : undefined,
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
      <DashboardHeader title="Communication" description="Announcements and notice board" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Compose Announcement
            </CardTitle>
            <CardDescription>Send an in-app announcement to all, a class, or an individual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Announcement title"
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
                <Select
                  value={form.audienceType}
                  onValueChange={(v) => setForm((f) => ({ ...f, audienceType: v, targetId: "" }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Class">Class</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.audienceType === "Class" || form.audienceType === "Individual") && (
                <div className="space-y-2">
                  <Label>{form.audienceType === "Class" ? "Class" : "Target ID"}</Label>
                  {form.audienceType === "Class" ? (
                    <Select value={form.targetId} onValueChange={(v) => setForm((f) => ({ ...f, targetId: v }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <CardTitle>Notice Board / Recent Announcements</CardTitle>
            <CardDescription>All published announcements. Visible to students on the portal based on audience.</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.audienceType}</TableCell>
                      <TableCell>{a.targetName ?? a.targetId ?? "—"}</TableCell>
                      <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
