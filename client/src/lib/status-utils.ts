import { Contract } from "@shared/schema";

export type ContractStatus = 
  | "Draft" 
  | "Pending Approval" 
  | "Approved" 
  | "Rejected" 
  | "Executed" 
  | "Expired";

/**
 * Get the CSS classes for the status badge based on contract status
 */
export const getStatusBadgeStyle = (status: ContractStatus | string): string => {
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

/**
 * Get the display text for the contract status
 */
export const getStatusDisplayText = (status: ContractStatus | string): string => {
  switch (status) {
    case "Pending Approval":
      return "Pending";
    default:
      return status;
  }
};

/**
 * Check if a contract can be edited
 */
export const canEditContract = (contract: Contract, userId: number): boolean => {
  return contract.createdBy === userId && contract.status === "Draft";
};

/**
 * Check if a contract can be submitted for approval
 */
export const canSubmitForApproval = (contract: Contract, userId: number): boolean => {
  return contract.createdBy === userId && contract.status === "Draft";
};

/**
 * Check if a contract can be approved/rejected
 */
export const canReviewContract = (contract: Contract, userRole: string): boolean => {
  return userRole === "Approver" && contract.status === "Pending Approval";
};

/**
 * Check if a contract can be executed
 */
export const canExecuteContract = (contract: Contract, userId: number): boolean => {
  return contract.createdBy === userId && contract.status === "Approved";
};

/**
 * Check if a contract can be exported as PDF
 */
export const canExportContract = (contract: Contract): boolean => {
  return contract.status === "Approved" || contract.status === "Executed";
};

/**
 * Get the count of contracts by status
 */
export const getContractStatusCounts = (contracts: Contract[]): Record<ContractStatus, number> => {
  const counts = {
    "Draft": 0,
    "Pending Approval": 0,
    "Approved": 0,
    "Rejected": 0,
    "Executed": 0,
    "Expired": 0
  };
  
  contracts.forEach(contract => {
    if (counts.hasOwnProperty(contract.status)) {
      counts[contract.status as ContractStatus]++;
    }
  });
  
  return counts;
};

/**
 * Get contracts that are expiring soon (within 30 days)
 */
export const getExpiringContracts = (contracts: Contract[]): Contract[] => {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return contracts.filter(contract => 
    contract.status === "Executed" && 
    contract.expiryDate && 
    new Date(contract.expiryDate) > today &&
    new Date(contract.expiryDate) < thirtyDaysFromNow
  );
};
