import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, FileText, X } from "lucide-react";
import { ContractWithApproval, ContractApproval } from "@shared/schema";

interface ApprovalCardProps {
  contract: ContractWithApproval;
  approval: ContractApproval & { approver: { username: string; fullName: string } };
}

export function ApprovalCard({ contract, approval }: ApprovalCardProps) {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");

  // Approve contract mutation
  const approveContractMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/approvals/${approval.id}/review`, {
        status: "Approved",
        feedback,
      });
    },
    onSuccess: () => {
      toast({
        title: "Contract approved",
        description: "You have approved this contract",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
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
    mutationFn: async () => {
      if (!feedback) {
        throw new Error("Feedback is required when rejecting a contract");
      }
      await apiRequest("POST", `/api/approvals/${approval.id}/review`, {
        status: "Rejected",
        feedback,
      });
    },
    onSuccess: () => {
      toast({
        title: "Contract rejected",
        description: "You have rejected this contract",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
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

  const handleApprove = () => {
    approveContractMutation.mutate();
  };

  const handleReject = () => {
    if (!feedback) {
      toast({
        title: "Feedback required",
        description: "Please provide feedback when rejecting a contract",
        variant: "destructive",
      });
      return;
    }
    rejectContractMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            <Link href={`/contract/${contract.id}`}>
              <a className="text-primary hover:underline">{contract.name}</a>
            </Link>
          </CardTitle>
          <Badge variant="outline" className="bg-orange-100 text-orange-600">
            Pending Approval
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
        
        <div className="mb-4">
          <Link href={`/contract/${contract.id}`}>
            <a className="text-primary hover:underline text-sm">View contract details</a>
          </Link>
        </div>
        
        <Textarea
          placeholder="Enter your feedback (required for rejection)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="mb-4"
        />
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
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
      </CardFooter>
    </Card>
  );
}
