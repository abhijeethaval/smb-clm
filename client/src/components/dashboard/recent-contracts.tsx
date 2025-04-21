import { Link } from "wouter";
import { Contract, ContractWithMeta } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type RecentContractsProps = {
  contracts: ContractWithMeta[];
  isLoading: boolean;
};

export function RecentContracts({ contracts, isLoading }: RecentContractsProps) {
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
    <Card className="bg-white rounded-md shadow-sm border border-neutral-200">
      <CardHeader className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium">Recent Contracts</h3>
        <Link href="/contracts" className="text-primary text-sm hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="font-medium text-neutral-600">Contract Name</TableHead>
                <TableHead className="font-medium text-neutral-600">Parties</TableHead>
                <TableHead className="font-medium text-neutral-600">Value</TableHead>
                <TableHead className="font-medium text-neutral-600">Status</TableHead>
                <TableHead className="font-medium text-neutral-600">Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : contracts.length > 0 ? (
                contracts.map((contract) => (
                  <TableRow key={contract.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                    <TableCell>
                      <Link href={`/contract/${contract.id}`} className="text-primary hover:underline font-medium">
                        {contract.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-neutral-700">{contract.parties}</TableCell>
                    <TableCell className="text-neutral-700">
                      {contract.contractValue ? `$${contract.contractValue.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeStyle(contract.status)}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                    No contracts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
