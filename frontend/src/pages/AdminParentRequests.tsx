import { useState, useEffect } from "react";
import { Search, X, Check, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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
  userId: { name: string; registerNumber?: string; phone?: string };
  requestType: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  adminComment?: string;
}

export default function AdminParentRequests() {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeRequest, setActiveRequest] = useState<RequestDto | null>(null);
  const [adminReply, setAdminReply] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await fetchApi("/requests?role=parent");
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch parent requests",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetchApi(`/requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          adminComment: adminReply || undefined,
        }),
      });
      toast({
        title: "Request Updated",
        description: `Request marked as ${newStatus}`,
      });
      setActiveRequest(null);
      setAdminReply("");
      loadRequests();
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "message" in error
          ? (error as Error).message
          : "Failed to update request";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" || req.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Table columns
  const requestColumns: DataTableColumn<RequestDto>[] = [
    {
      key: "parent",
      header: "Parent",
      cell: (req) => (
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{req.userId?.name || "Unknown"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{req.userId?.registerNumber}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type & Subject",
      cell: (req) => (
        <div>
          <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 mb-1">
            {req.requestType}
          </span>
          <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{req.subject}</p>
        </div>
      ),
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
      align: "center",
      className: "w-[120px]",
      cell: (req) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs"
          onClick={() => {
            setActiveRequest(req);
            setAdminReply(req.adminComment || "");
          }}
        >
          View & Reply
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by parent name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {["All", "Pending", "Approved", "Rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStatus === s ? "gradient-primary text-white shadow-md" : "bg-card text-muted-foreground border border-border hover:bg-muted"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* DataTable Component */}
      <DataTable
        data={filteredRequests}
        columns={requestColumns}
        keyExtractor={(req) => req._id}
        emptyMessage="No requests found"
        emptyDescription="Try adjusting the filters or wait for new requests"
      />

      {/* Modal for viewing/replying */}
      {activeRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card overflow-hidden shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Review Request</h2>
              <button onClick={() => setActiveRequest(null)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-foreground">{activeRequest.userId?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Login ID: {activeRequest.userId?.registerNumber}
                    {activeRequest.userId?.phone ? ` • Phone: ${activeRequest.userId.phone}` : ""}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${getStatusBadge(activeRequest.status).variant === "warning" ? "bg-amber-100 text-amber-700 border-amber-200" : getStatusBadge(activeRequest.status).variant === "success" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                  {activeRequest.status}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                    {activeRequest.requestType}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(activeRequest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground">{activeRequest.subject}</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{activeRequest.message}</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Admin Reply
                </label>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  rows={4}
                  placeholder="Type your response to the parent here..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus-visible:ring-2 focus-visible:ring-ring outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/20 flex flex-wrap gap-3 justify-end items-center">
              <Button variant="outline" className="rounded-xl" onClick={() => setActiveRequest(null)}>
                Cancel
              </Button>
              {activeRequest.status !== "Rejected" && (
                <Button
                  variant="outline"
                  className="rounded-xl text-destructive hover:bg-destructive/10 border-destructive/20"
                  onClick={() => handleUpdateStatus(activeRequest._id, "Rejected")}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              )}
              {activeRequest.status !== "Approved" && (
                <Button
                  className="rounded-xl bg-success text-white hover:bg-success/90"
                  onClick={() => handleUpdateStatus(activeRequest._id, "Approved")}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
              )}
              {activeRequest.status !== "Pending" && (
                <Button
                  className="rounded-xl gradient-primary text-white"
                  onClick={() => handleUpdateStatus(activeRequest._id, activeRequest.status)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Update Reply
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}