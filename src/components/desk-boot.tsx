import { useEffect } from "react";
import { NewSignalDialog } from "@/components/new-signal";
import { Onboarding } from "@/components/onboarding";
import { hydrateDesk } from "@/lib/store";

export function DeskBoot() {
  useEffect(() => {
    hydrateDesk();
  }, []);
  return (
    <>
      <Onboarding />
      <NewSignalDialog />
    </>
  );
}
