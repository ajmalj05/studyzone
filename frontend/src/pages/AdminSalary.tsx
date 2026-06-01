import { useState } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { PillTabs } from "@/components/ui/pill-tabs";
import { CheckCircle, Calendar, WalletCards, TrendingUp, Users } from "lucide-react";
import { MonthlyPayrollTab } from "@/components/payroll/tabs/MonthlyPayrollTab";
import { TeacherSalariesTab } from "@/components/payroll/tabs/TeacherSalariesTab";
import { StaffMonthlyPayrollTab } from "@/components/payroll/tabs/StaffMonthlyPayrollTab";
import { StaffSalariesTab } from "@/components/payroll/tabs/StaffSalariesTab";
import { IncrementsTab } from "@/components/payroll/tabs/IncrementsTab";
import { SalaryHistoryTab } from "@/components/payroll/tabs/SalaryHistoryTab";

export default function AdminSalary() {
  const [activeTab, setActiveTab] = useState<
    "monthly" | "salaries" | "staff-monthly" | "staff-salaries" | "increments" | "history"
  >("monthly");

  usePageHeaderConfigEffect(
    { title: "Payroll", description: "Manage monthly payroll, salary setups, increments, and salary history for teachers and staff." },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="px-1 overflow-x-auto pb-2 scrollbar-none">
        <PillTabs
          tabs={[
            { value: "monthly", label: "Teacher Payroll", icon: Calendar },
            { value: "salaries", label: "Teacher Salaries", icon: WalletCards },
            { value: "staff-monthly", label: "Staff Payroll", icon: Calendar },
            { value: "staff-salaries", label: "Staff Salaries", icon: WalletCards },
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
        {activeTab === "staff-monthly" && <StaffMonthlyPayrollTab />}
        {activeTab === "staff-salaries" && <StaffSalariesTab />}
        {activeTab === "increments" && <IncrementsTab />}
        {activeTab === "history" && <SalaryHistoryTab />}
      </div>
    </div>
  );
}

