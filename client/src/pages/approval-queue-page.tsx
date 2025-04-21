import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ApprovalCard } from "@/components/approval/approval-card";
import { CheckCheck, Clock, AlertTriangle, FileText } from "lucide-react";
import { ContractWithApproval } from "@shared/schema";

export default function ApprovalQueuePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading } = useQuery<ContractWithApproval[]>({
    queryKey: ["/api/approvals"],
  });

  // Filter approvals based on active tab
  const filtered = pendingApprovals ? pendingApprovals.filter(contract => {
    if (activeTab === "pending") {
      return contract.approvals?.some(a => a.status === "Pending");
    }
    if (activeTab === "approved") {
      return contract.approvals?.some(a => a.status === "Approved");
    }
    if (activeTab === "rejected") {
      return contract.approvals?.some(a => a.status === "Rejected");
    }
    return true;
  }) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium">Approval Queue</h1>
            <p className="text-gray-500">Review and approve contracts that require your attention</p>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              <Clock className="mr-2 h-4 w-4" />
              Pending
              {pendingApprovals && pendingApprovals.filter(c => c.approvals?.some(a => a.status === "Pending")).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingApprovals.filter(c => c.approvals?.some(a => a.status === "Pending")).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCheck className="mr-2 h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((contract) => {
                  const pendingApproval = contract.approvals?.find(a => a.status === "Pending");
                  return pendingApproval ? (
                    <ApprovalCard 
                      key={contract.id}
                      contract={contract}
                      approval={pendingApproval}
                    />
                  ) : null;
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCheck className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No pending approvals</h3>
                  <p className="text-gray-500">You have no contracts waiting for your approval.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((contract) => {
                  const approvedApproval = contract.approvals?.find(a => a.status === "Approved");
                  return approvedApproval ? (
                    <Card key={contract.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            <Link href={`/contract/${contract.id}`}>
                              <a className="text-primary hover:underline">{contract.name}</a>
                            </Link>
                          </CardTitle>
                          <Badge variant="outline" className="bg-green-100 text-green-600">
                            Approved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Parties</p>
                            <p className="font-medium">{contract.parties}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Value</p>
                            <p className="font-medium">
                              {contract.contractValue ? `$${contract.contractValue.toLocaleString()}` : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Effective Date</p>
                            <p className="font-medium">
                              {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Created By</p>
                            <p className="font-medium">{contract.createdByUser?.fullName || "Unknown"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Approved on</p>
                          <p className="font-medium">
                            {approvedApproval.actionDate ? new Date(approvedApproval.actionDate).toLocaleString() : "—"}
                          </p>
                        </div>
                        {approvedApproval.feedback && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                            <p className="font-medium">Your feedback:</p>
                            <p>{approvedApproval.feedback}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null;
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCheck className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No approved contracts</h3>
                  <p className="text-gray-500">You haven't approved any contracts yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((contract) => {
                  const rejectedApproval = contract.approvals?.find(a => a.status === "Rejected");
                  return rejectedApproval ? (
                    <Card key={contract.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            <Link href={`/contract/${contract.id}`}>
                              <a className="text-primary hover:underline">{contract.name}</a>
                            </Link>
                          </CardTitle>
                          <Badge variant="outline" className="bg-red-100 text-red-600">
                            Rejected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Parties</p>
                            <p className="font-medium">{contract.parties}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Value</p>
                            <p className="font-medium">
                              {contract.contractValue ? `$${contract.contractValue.toLocaleString()}` : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Effective Date</p>
                            <p className="font-medium">
                              {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Created By</p>
                            <p className="font-medium">{contract.createdByUser?.fullName || "Unknown"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rejected on</p>
                          <p className="font-medium">
                            {rejectedApproval.actionDate ? new Date(rejectedApproval.actionDate).toLocaleString() : "—"}
                          </p>
                        </div>
                        {rejectedApproval.feedback && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md text-sm">
                            <p className="font-medium">Your feedback:</p>
                            <p>{rejectedApproval.feedback}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null;
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No rejected contracts</h3>
                  <p className="text-gray-500">You haven't rejected any contracts yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
