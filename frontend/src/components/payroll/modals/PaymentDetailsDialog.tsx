import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { TeacherSalaryPaymentDto, formatPayrollCurrency, payrollMonthName } from "@/types/payroll";

interface PaymentDetailsDialogProps {
  payment: TeacherSalaryPaymentDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteLine?: (paymentId: string, lineId: string) => void;
}

export function PaymentDetailsDialog({ payment, open, onOpenChange, onDeleteLine }: PaymentDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
          <DialogDescription>
            {payment?.teacherName} - {payment && payrollMonthName(payment.month)} {payment?.year}. Net:{" "}
            {payment && formatPayrollCurrency(payment.netAmount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {payment?.lines?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deductions or additions.</p>
          ) : (
            payment?.lines?.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
                <span className="flex-1">{line.description} ({line.lineType})</span>
                <span className={line.lineType === "Deduction" ? "text-red-600" : "text-green-600"}>
                  {line.lineType === "Deduction" ? "-" : "+"}{formatPayrollCurrency(line.amount)}
                </span>
                {onDeleteLine ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-8 w-8 p-0"
                    onClick={() => onDeleteLine(payment.id, line.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
