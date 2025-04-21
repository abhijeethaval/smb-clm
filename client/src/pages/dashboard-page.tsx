import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusCard } from "@/components/dashboard/status-card";
import { RecentContracts } from "@/components/dashboard/recent-contracts";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { CreateContractModal } from "@/components/modals/create-contract-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Contract, ContractTemplate, ContractWithMeta } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch contracts
  const { data: contracts, isLoading: isLoadingContracts } = useQuery<ContractWithMeta[]>({
    queryKey: ["/api/contracts"],
  });

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/templates"],
  });

  // Create a new contract
  const handleCreateContract = async (contractData: any) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/contracts", contractData);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Contract created",
        description: "Your contract has been created successfully.",
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      toast({
        title: "Error creating contract",
        description: error instanceof Error ? error.message : "Failed to create contract",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const statusCards = [
    { status: "Draft", count: dashboardStats?.statusCounts?.Draft || 0 },
    { status: "Pending", count: dashboardStats?.statusCounts?.["Pending Approval"] || 0 },
    { status: "Approved", count: dashboardStats?.statusCounts?.Approved || 0 },
    { status: "Expiring", count: dashboardStats?.expiringSoon || 0 },
  ];

  const recentContracts = contracts ? 
    [...contracts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 4) : 
    [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-medium mb-1">Dashboard</h2>
            <p className="text-neutral-600">
              Welcome back, {user?.fullName}. Here's an overview of your contract activities.
            </p>
          </div>
          {user?.role === "Author" && (
            <Button onClick={openCreateModal} className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Contract
            </Button>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <StatusCard 
              key={card.status} 
              status={card.status} 
              count={card.count} 
              change={Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1)} // Mock change data
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Contracts */}
          <div className="lg:col-span-2">
            <RecentContracts 
              contracts={recentContracts} 
              isLoading={isLoadingContracts} 
            />
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-1">
            <ActivityLog 
              activities={dashboardStats?.recentActivities || []} 
              isLoading={isLoadingStats} 
            />
          </div>
        </div>
      </div>

      {/* Create Contract Modal */}
      {templates && (
        <CreateContractModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          onSubmit={handleCreateContract}
          templates={templates}
          isSubmitting={isSubmitting}
        />
      )}
    </AppLayout>
  );
}
