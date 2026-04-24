import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeeStructures from "./FeeStructures";
import FeeOffers from "./FeeOffers";

export default function FeeSetup() {
  usePageHeaderConfigEffect(
    {
      title: "Fee setup",
      description: "Configure fee structures and concessions for the selected academic year from one place.",
    },
    [],
  );

  return (
    <div className="space-y-4">
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
