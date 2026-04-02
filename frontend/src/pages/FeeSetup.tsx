import { DashboardHeader } from "@/components/DashboardHeader";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeeStructures from "./FeeStructures";
import FeeOffers from "./FeeOffers";

export default function FeeSetup() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader
          title="Fee Setup"
          description="Configure fee structures and concessions for the selected academic year from one place."
        />
        <CurrentAcademicYearBadge />
      </div>

      <Tabs defaultValue="structures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="offers">Concessions</TabsTrigger>
        </TabsList>
        <TabsContent value="structures">
          <FeeStructures />
        </TabsContent>
        <TabsContent value="offers">
          <FeeOffers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
