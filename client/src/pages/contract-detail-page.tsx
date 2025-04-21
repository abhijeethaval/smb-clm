import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ContractEditor } from "@/components/contracts/contract-editor";
import { ContractHistory } from "@/components/contracts/contract-history";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadContractPDF } from "@/lib/pdf-generator";
import {
  ArrowLeft,
  Download,
  Send,
  Check,
  X,
  PlayCircle,
  Calendar,
  DollarSign,
  Users,
  FileType,
  Clock,
} from "lucide-react";
import { ContractWithMeta, ContractWithApproval, ContractVersion, User } from "@shared/schema";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [feedback, setFeedback] = useState("");
  const [users, setUsers] = useState<Record<number, User>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch contract details
  const {
    data: contract,
    isLoading: isLoadingContract,
    refetch: refetchContract,
  } = useQuery<ContractWithMeta>({
    queryKey: [`/api/contracts/${id}`],
  });

  // Fetch contract versions
  const {
    data: versions,
    isLoading: isLoadingVersions,
    refetch: refetchVersions,
  } = useQuery<ContractVersion[]>({
    queryKey: [`/api/contracts/${id}/versions`],
    enabled: !!contract,
  });
  
  // Fetch approvals (only if user is an approver)
  const { data: approvals } = useQuery<any>({
    queryKey: [`/api/approvals`],
    enabled: user?.role === "Approver",
  });

  // Find the current approval for the logged-in approver if applicable
  const currentApproval = approvals && Array.isArray(approvals) 
    ? approvals.find((a: any) => 
        a.id === parseInt(id) && 
        a.approvals?.some((approval: any) => 
          approval.approverId === user?.id && 
          approval.status === "Pending"
        )
      )?.approvals?.find((approval: any) => 
        approval.approverId === user?.id && 
        approval.status === "Pending"
      )
    : null;

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async ({ content, changeDescription }: { content: string; changeDescription: string }) => {
      await apiRequest("PUT", `/api/contracts/${id}`, {
        content,
        changeDescription,
      });
    },
    onSuccess: () => {
      refetchContract();
      refetchVersions();
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating contract",
        description: error instanceof Error ? error.message : "Failed to update contract",
        variant: "destructive",
      });
    },
  });

  // Submit for approval mutation
  const submitForApprovalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/contracts/${id}/submit`, {});
    },
    onSuccess: () => {
      refetchContract();
      toast({
        title: "Contract submitted",
        description: "Your contract has been submitted for approval",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error submitting contract",
        description: error instanceof Error ? error.message : "Failed to submit contract",
        variant: "destructive",
      });
    },
  });

  // Approve contract mutation
  const approveContractMutation = useMutation({
    mutationFn: async (approvalId: number) => {
      await apiRequest("POST", `/api/approvals/${approvalId}/review`, {
        status: "Approved",
        feedback,
      });
    },
    onSuccess: () => {
      refetchContract();
      toast({
        title: "Contract approved",
        description: "You have approved this contract",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error approving contract",
        description: error instanceof Error ? error.message : "Failed to approve contract",
        variant: "destructive",
      });
    },
  });

  // Reject contract mutation
  const rejectContractMutation = useMutation({
    mutationFn: async (approvalId: number) => {
      if (!feedback) {
        throw new Error("Feedback is required when rejecting a contract");
      }
      await apiRequest("POST", `/api/approvals/${approvalId}/review`, {
        status: "Rejected",
        feedback,
      });
    },
    onSuccess: () => {
      refetchContract();
      toast({
        title: "Contract rejected",
        description: "You have rejected this contract",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error rejecting contract",
        description: error instanceof Error ? error.message : "Failed to reject contract",
        variant: "destructive",
      });
    },
  });

  // Execute contract mutation
  const executeContractMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/contracts/${id}/execute`, {});
    },
    onSuccess: () => {
      refetchContract();
      toast({
        title: "Contract executed",
        description: "Your contract has been executed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error executing contract",
        description: error instanceof Error ? error.message : "Failed to execute contract",
        variant: "destructive",
      });
    },
  });

  const handleSaveChanges = async (content: string, changeDescription: string) => {
    updateContractMutation.mutate({ content, changeDescription });
  };

  const handleSubmitForApproval = () => {
    submitForApprovalMutation.mutate();
  };

  const handleApprove = () => {
    if (currentApproval) {
      approveContractMutation.mutate(currentApproval.id);
    }
  };

  const handleReject = () => {
    if (currentApproval) {
      if (!feedback) {
        toast({
          title: "Feedback required",
          description: "Please provide feedback when rejecting a contract",
          variant: "destructive",
        });
        return;
      }
      rejectContractMutation.mutate(currentApproval.id);
    }
  };

  const handleExecute = () => {
    executeContractMutation.mutate();
  };

  const handleExportPdf = async () => {
    if (contract) {
      setIsGeneratingPdf(true);
      try {
        await downloadContractPDF(contract);
        toast({
          title: "PDF generated",
          description: "Your contract has been exported as PDF",
        });
      } catch (error) {
        toast({
          title: "Error generating PDF",
          description: "Failed to generate PDF",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleViewVersion = (content: string) => {
    // Open a modal or tab with the content
    // Simplified for this implementation - just update active tab and show content in read-only mode
    setActiveTab("editor");
    if (contract) {
      // Create a temporary contract object with the old content
      const tempContract = { ...contract, content };
      // Now you would display this content (this is a simplified version)
      // In a real app, you might use a modal or dedicated component
      toast({
        title: "Viewing historical version",
        description: "This is a read-only view of a previous version",
      });
    }
  };

  const handleRestoreVersion = (version: ContractVersion) => {
    if (contract && contract.status === "Draft") {
      updateContractMutation.mutate({
        content: version.content,
        changeDescription: `Restored from version created on ${new Date(version.changedAt).toLocaleString()}`,
      });
    } else {
      toast({
        title: "Cannot restore version",
        description: "You can only restore versions when the contract is in Draft status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-blue-100 text-blue-600 hover:bg-blue-100";
      case "Pending Approval":
        return "bg-orange-100 text-orange-600 hover:bg-orange-100";
      case "Approved":
        return "bg-green-100 text-green-600 hover:bg-green-100";
      case "Rejected":
        return "bg-red-100 text-red-600 hover:bg-red-100";
      case "Executed":
        return "bg-purple-100 text-purple-600 hover:bg-purple-100";
      case "Expired":
        return "bg-gray-100 text-gray-600 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    }
  };

  if (isLoadingContract) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!contract) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold mb-4">Contract Not Found</h2>
          <p className="text-gray-500 mb-6">The contract you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/contracts">
              <a>Back to Contracts</a>
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canEdit = user?.role === "Author" && contract.status === "Draft";
  const canSubmitForApproval = user?.role === "Author" && contract.status === "Draft";
  const canApprove = user?.role === "Approver" && contract.status === "Pending Approval" && currentApproval;
  const canExecute = user?.id === contract.createdBy && contract.status === "Approved";
  const canExport = contract.status === "Approved" || contract.status === "Executed";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-medium">{contract.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Created by {contract.createdByUser?.fullName || "Unknown"}</span>
                <span>•</span>
                <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={`${getStatusBadgeStyle(contract.status)} px-3 py-1`}>
            {contract.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Effective Date:</span>
                  <p className="font-medium">
                    {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Expiry Date:</span>
                  <p className="font-medium">
                    {contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Contract Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">
                {contract.contractValue ? `$${contract.contractValue.toLocaleString()}` : "Not specified"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Parties Involved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{contract.parties}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="editor">Contract Content</TabsTrigger>
            {versions && versions.length > 0 && (
              <TabsTrigger value="history">Version History</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{contract.description || "No description provided."}</p>
              </CardContent>
            </Card>

            {/* Approvals section */}
            {(contract.status === "Pending Approval" || contract.status === "Approved" || contract.status === "Rejected") && (
              <Card>
                <CardHeader>
                  <CardTitle>Approval Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {contract.approvals && contract.approvals.length > 0 ? (
                    <div className="space-y-4">
                      {contract.approvals.map((approval) => (
                        <div key={approval.id} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{approval.approver.fullName}</h4>
                              <p className="text-sm text-gray-500">
                                Requested: {new Date(approval.requestedAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className={getStatusBadgeStyle(approval.status)}>
                              {approval.status}
                            </Badge>
                          </div>
                          {approval.feedback && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                              <p className="font-medium">Feedback:</p>
                              <p>{approval.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No approval information available.</p>
                  )}

                  {canApprove && (
                    <div className="mt-6 space-y-4">
                      <Textarea
                        placeholder="Enter your feedback (required for rejection)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          disabled={rejectContractMutation.isPending}
                          onClick={handleReject}
                        >
                          <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button 
                          variant="default"
                          disabled={approveContractMutation.isPending}
                          onClick={handleApprove}
                        >
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="editor" className="space-y-6 mt-6">
            <ContractEditor
              contract={contract}
              onSave={handleSaveChanges}
              isSaving={updateContractMutation.isPending}
              readOnly={!canEdit}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <ContractHistory
              versions={versions || []}
              users={{}}
              currentContent={contract.content}
              onViewVersion={handleViewVersion}
              onRestoreVersion={handleRestoreVersion}
              isLoading={isLoadingVersions}
            />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {canSubmitForApproval && (
                <Button 
                  onClick={handleSubmitForApproval}
                  disabled={submitForApprovalMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              )}

              {canExecute && (
                <Button 
                  onClick={handleExecute}
                  disabled={executeContractMutation.isPending}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Execute Contract
                </Button>
              )}

              {canExport && (
                <Button 
                  variant="outline" 
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
