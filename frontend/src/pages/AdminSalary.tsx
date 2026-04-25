import { useState } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { PillTabs } from "@/components/ui/pill-tabs";
import { CheckCircle, Calendar, WalletCards, TrendingUp } from "lucide-react";
import { MonthlyPayrollTab } from "@/components/payroll/tabs/MonthlyPayrollTab";
import { TeacherSalariesTab } from "@/components/payroll/tabs/TeacherSalariesTab";
import { IncrementsTab } from "@/components/payroll/tabs/IncrementsTab";
import { SalaryHistoryTab } from "@/components/payroll/tabs/SalaryHistoryTab";

export default function AdminSalary() {
  const [activeTab, setActiveTab] = useState<"monthly" | "salaries" | "increments" | "history">("monthly");

  usePageHeaderConfigEffect(
    { title: "Payroll", description: "Manage monthly payroll, teacher salary setup, increments, and salary history." },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="px-1">
        <PillTabs
          tabs={[
            { value: "monthly", label: "Monthly Payroll", icon: Calendar },
            { value: "salaries", label: "Teacher Salaries", icon: WalletCards },
            { value: "increments", label: "Increments", icon: TrendingUp },
            { value: "history", label: "Paid & History", icon: CheckCircle },
          ]}
          activeValue={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        />
      </div>

      <div className="px-1 space-y-6">
        {activeTab === "monthly" && <MonthlyPayrollTab />}
        {activeTab === "salaries" && <TeacherSalariesTab />}
        {activeTab === "increments" && <IncrementsTab />}
        {activeTab === "history" && <SalaryHistoryTab />}
      </div>
    </div>
  );
}
