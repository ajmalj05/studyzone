import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Search, X, Check, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

const statusStyle: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AdminParentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
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

  return (
    <div className="space-y-4">
      <DashboardHeader
        title="Parent Requests"
        description="Manage and respond to parent issues and inquiries"
      />

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-x-auto rounded-[var(--radius)] bg-card shadow-card"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left font-semibold text-foreground">
                Parent
              </th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">
                Type & Subject
              </th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-center font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req, i) => (
                <motion.tr
                  key={req._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">
                      {req.userId?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.userId?.registerNumber}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary mb-1 inline-block">
                      {req.requestType}
                    </span>
                    <p className="font-medium text-foreground text-sm">
                      {req.subject}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${statusStyle[req.status]}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setActiveRequest(req);
                        setAdminReply(req.adminComment || "");
                      }}
                    >
                      View & Reply
                    </Button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  No requests found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {activeRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-card overflow-hidden shadow-card-hover flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  Review Request
                </h2>
                <button
                  onClick={() => setActiveRequest(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {activeRequest.userId?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Login ID: {activeRequest.userId?.registerNumber}
                      {activeRequest.userId?.phone
                        ? ` • Phone: ${activeRequest.userId.phone}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${statusStyle[activeRequest.status]}`}
                  >
                    {activeRequest.status}
                  </span>
                </div>

                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {activeRequest.requestType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activeRequest.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground">
                    {activeRequest.subject}
                  </h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                    {activeRequest.message}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Admin
                    Reply
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
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setActiveRequest(null)}
                >
                  Cancel
                </Button>
                {activeRequest.status !== "Rejected" && (
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() =>
                      handleUpdateStatus(activeRequest._id, "Rejected")
                    }
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject Request
                  </Button>
                )}
                {activeRequest.status !== "Approved" && (
                  <Button
                    className="rounded-xl bg-success text-white hover:bg-success/90"
                    onClick={() =>
                      handleUpdateStatus(activeRequest._id, "Approved")
                    }
                  >
                    <Check className="h-4 w-4 mr-2" /> Approve Request
                  </Button>
                )}
                {activeRequest.status !== "Pending" && (
                  <Button
                    className="rounded-xl gradient-primary text-white"
                    onClick={() =>
                      handleUpdateStatus(
                        activeRequest._id,
                        activeRequest.status
                      )
                    }
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Update Reply
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
