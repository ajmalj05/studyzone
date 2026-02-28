import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Send, CheckCircle, Clock, XCircle } from "lucide-react";
const requestTypes = ["Leave Request", "Fee Issue", "Exam Issue", "General Request"];

const statusStyle: Record<string, string> = {
  Pending: "bg-warning/15 text-warning",
  Approved: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
};

const StudentRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [type, setType] = useState(requestTypes[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?._id) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      const data = await fetchApi(`/requests?role=student&userId=${user?._id}`);
      setRequests(data);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load requests", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Validation Error", description: "Subject and Message are required", variant: "destructive" });
      return;
    }

    try {
      await fetchApi('/requests', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?._id,
          role: 'student',
          requestType: type,
          subject,
          message
        })
      });

      setSubject("");
      setMessage("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      loadRequests(); // Reload
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit request", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">My Requests</h1>

        {/* New Request Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Submit a Request to Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Request Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring appearance-none">
                    {requestTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief subject line" className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Describe your request..." className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus-visible:ring-2 focus-visible:ring-ring outline-none" />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Optional Attachment (URL)</label>
                <input type="url" placeholder="Paste an external link to your attachment (e.g. Google Drive)" className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSubmit}>
                <Send className="h-4 w-4" /> Submit Request
              </Button>

              {/* Success Animation */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CheckCircle className="h-4 w-4" /> Request submitted successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Existing Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Request History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have not submitted any requests yet.</p>
              ) : (
                requests.map((req, i) => (
                  <motion.div key={req._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border p-5 shadow-sm bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{req.requestType}</span>
                          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${statusStyle[req.status]} ${req.status === 'Pending' ? 'border-warning/30' : req.status === 'Approved' ? 'border-success/30' : 'border-destructive/30'}`}>
                            {req.status === 'Pending' && <Clock className="h-3.5 w-3.5" />}
                            {req.status === 'Approved' && <CheckCircle className="h-3.5 w-3.5" />}
                            {req.status === 'Rejected' && <XCircle className="h-3.5 w-3.5" />}
                            {req.status}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-foreground">{req.subject || req.requestType}</h4>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2.5 py-1 rounded-full">
                        {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <div className="bg-background rounded-lg border border-border p-3 mt-2">
                      <p className="text-sm text-foreground/80 leading-relaxed">{req.message}</p>
                    </div>

                    {req.adminComment && (
                      <div className="mt-4 bg-primary/5 rounded-lg border border-primary/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <UserCircle className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Admin Reply</span>
                        </div>
                        <p className="text-sm text-foreground/90 pl-8">{req.adminComment}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
};

export default StudentRequests;
