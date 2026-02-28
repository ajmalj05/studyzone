import { UserPlus, DollarSign, FileText, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: UserPlus, label: "Add Student", description: "Enroll new student", path: "/admin/students" },
  { icon: DollarSign, label: "Collect Fee", description: "Record payment", path: "/admin/fees" },
  { icon: FileText, label: "Create Exam", description: "Schedule new exam", path: "/admin/exams" },
  { icon: ClipboardCheck, label: "Mark Attendance", description: "Today's attendance", path: "/admin/attendance" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1 rounded-md gradient-primary p-3 h-auto text-primary-foreground hover:opacity-90"
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-semibold">{action.label}</span>
            <span className="text-xs text-primary-foreground/80">{action.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
