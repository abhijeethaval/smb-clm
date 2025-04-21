import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateContractModal } from "@/components/modals/create-contract-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  PlusCircle, 
  Search, 
  MoreVertical, 
  FileText, 
  Trash, 
  FileEdit, 
  Send, 
  Check, 
  X 
} from "lucide-react";
import { ContractWithMeta, ContractTemplate } from "@shared/schema";

export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch contracts
  const { data: contracts, isLoading } = useQuery<ContractWithMeta[]>({
    queryKey: ["/api/contracts"],
  });

  // Fetch templates
  const { data: templates } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/templates"],
  });

  // Submit contract for approval mutation
  const submitForApprovalMutation = useMutation({
    mutationFn: async (contractId: number) => {
      await apiRequest("POST", `/api/contracts/${contractId}/submit`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Success",
        description: "Contract submitted for approval",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit contract",
        variant: "destructive",
      });
    },
  });

  // Create a new contract
  const handleCreateContract = async (contractData: any) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/contracts", contractData);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
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

  // Submit contract for approval
  const handleSubmitForApproval = (contractId: number) => {
    submitForApprovalMutation.mutate(contractId);
  };

  // Filter contracts based on search query and status filter
  const filteredContracts = contracts
    ? contracts.filter(contract => {
        const matchesSearch = searchQuery === "" || 
          contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contract.parties.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  // Status badge style
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium">Contracts</h1>
          {user?.role === "Author" && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Contract
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contracts by name or parties"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Executed">Executed</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract Name</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.length > 0 ? (
                      filteredContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Link href={`/contract/${contract.id}`}>
                              <a className="text-primary hover:underline font-medium flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                {contract.name}
                              </a>
                            </Link>
                          </TableCell>
                          <TableCell>{contract.parties}</TableCell>
                          <TableCell>{contract.createdByUser?.fullName || "Unknown"}</TableCell>
                          <TableCell>
                            {contract.contractValue ? `$${contract.contractValue.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeStyle(contract.status)}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            {contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/contract/${contract.id}`}>
                                    <a className="flex items-center cursor-pointer">
                                      <FileText className="mr-2 h-4 w-4" />
                                      View
                                    </a>
                                  </Link>
                                </DropdownMenuItem>
                                
                                {user?.role === "Author" && contract.status === "Draft" && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/contract/${contract.id}`}>
                                        <a className="flex items-center cursor-pointer">
                                          <FileEdit className="mr-2 h-4 w-4" />
                                          Edit
                                        </a>
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleSubmitForApproval(contract.id)}
                                      disabled={submitForApprovalMutation.isPending}
                                    >
                                      <Send className="mr-2 h-4 w-4" />
                                      Submit for Approval
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {user?.role === "Approver" && contract.status === "Pending Approval" && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/contract/${contract.id}`}>
                                        <a className="flex items-center cursor-pointer">
                                          <Check className="mr-2 h-4 w-4 text-green-600" />
                                          Review
                                        </a>
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                          No contracts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Contract Modal */}
      {templates && (
        <CreateContractModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateContract}
          templates={templates}
          isSubmitting={isSubmitting}
        />
      )}
    </AppLayout>
  );
}
