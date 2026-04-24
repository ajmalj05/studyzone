import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";

const requestTypes = [
  "Fee Issue",
  "Attendance",
  "Report Card",
  "Timetable",
  "General Issue",
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: "warning" | "success" | "destructive" }> = {
    Pending: { label: "Pending", variant: "warning" },
    Approved: { label: "Approved", variant: "success" },
    Rejected: { label: "Rejected", variant: "destructive" },
  };
  return variants[status] || { label: status, variant: "secondary" as const };
};

interface RequestDto {
  _id: string;
  requestType: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  adminComment?: string;
}

const ParentRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [type, setType] = useState(requestTypes[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  usePageHeaderConfigEffect(
    {
      title: "Report an issue / contact admin",
      description: "Submit requests to the school office and track their status.",
    },
    [],
  );

  useEffect(() => {
    if (user?._id) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      const data = await fetchApi(
        `/requests?role=parent&userId=${user?._id}`
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load your requests",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and Message are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await fetchApi("/requests", {
        method: "POST",
        body: JSON.stringify({
          userId: user?._id,
          role: "parent",
          requestType: type,
          subject,
          message,
        }),
      });

      setSubject("");
      setMessage("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      loadRequests();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "message" in error
          ? (error as Error).message
          : "Failed to submit request";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // Table columns
  const requestColumns: DataTableColumn<RequestDto>[] = [
    {
      key: "requestType",
      header: "Type",
      badge: (req) => ({ label: req.requestType, variant: "indigo" }),
    },
    {
      key: "subject",
      header: "Subject",
      cell: (req) => <span className="font-medium text-slate-700 dark:text-slate-200">{req.subject || req.requestType}</span>,
    },
    {
      key: "date",
      header: "Date",
      cell: (req) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(req.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      badge: (req) => {
        const badge = getStatusBadge(req.status);
        return { label: badge.label, variant: badge.variant };
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[60px]",
      cell: (req) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const expandedRow = expandedId ? requests.find(r => r._id === expandedId) : null;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-[var(--radius)] shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Submit an Issue or Request to Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Issue Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                >
                  {requestTypes.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief subject line"
                  className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your issue or request..."
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus-visible:ring-2 focus-visible:ring-ring outline-none"
              />
            </div>

            <Button
              className="gradient-primary text-primary-foreground rounded-xl gap-2"
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4" /> Send to Admin
            </Button>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"
                >
                  <CheckCircle className="h-4 w-4" /> Request submitted
                  successfully. Admin will respond soon.
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Your Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            data={requests}
            columns={requestColumns}
            keyExtractor={(req) => req._id}
            emptyMessage="No requests yet"
            emptyDescription="Submit your first request using the form above"
          />
          
          {/* Expanded row content */}
          {expandedRow && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-muted/30 p-4 mt-4"
            >
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Your Message</span>
                  <p className="text-sm text-foreground mt-1">{expandedRow.message}</p>
                </div>
                {expandedRow.adminComment && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs font-medium text-primary uppercase">Admin Reply</span>
                    <p className="text-sm text-foreground mt-1">{expandedRow.adminComment}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentRequests;