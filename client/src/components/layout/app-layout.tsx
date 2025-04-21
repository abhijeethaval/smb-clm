import { ReactNode, useEffect, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useQuery } from "@tanstack/react-query";
import { Contract } from "@shared/schema";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [recentContracts, setRecentContracts] = useState<Array<{id: number; name: string}>>([]);

  // Fetch recent contracts
  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  // Fetch pending approvals count (only if user is an approver)
  const { data: approvals } = useQuery<any>({
    queryKey: ["/api/approvals"],
    retry: false,
  });

  useEffect(() => {
    // Update pending count if approvals data exists
    if (approvals && Array.isArray(approvals)) {
      setPendingCount(approvals.length);
    }

    // Update recent contracts
    if (contracts && contracts.length > 0) {
      const sortedContracts = [...contracts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(c => ({ id: c.id, name: c.name }));
      
      setRecentContracts(sortedContracts);
    }
  }, [contracts, approvals]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar pendingCount={pendingCount} recentContracts={recentContracts} />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
