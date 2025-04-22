import {
  users, User, InsertUser,
  contracts, Contract, InsertContract,
  contractTemplates, ContractTemplate, InsertContractTemplate,
  contractVersions, ContractVersion, InsertContractVersion,
  contractApprovals, ContractApproval, InsertContractApproval,
  activityLogs, ActivityLog, InsertActivityLog,
  ContractWithMeta, ContractWithApproval
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;

  // Contract Templates
  getTemplate(id: number): Promise<ContractTemplate | undefined>;
  getTemplateByName(name: string): Promise<ContractTemplate | undefined>;
  createTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  listTemplates(): Promise<ContractTemplate[]>;

  // Contracts
  getContract(id: number): Promise<Contract | undefined>;
  getContractWithMeta(id: number): Promise<ContractWithMeta | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  listContracts(): Promise<Contract[]>;
  listContractsWithMeta(): Promise<ContractWithMeta[]>;
  listContractsByUser(userId: number): Promise<Contract[]>;
  listContractsByStatus(status: string): Promise<Contract[]>;
  searchContracts(query: string): Promise<Contract[]>;
  
  // Contract Versions
  createContractVersion(version: InsertContractVersion): Promise<ContractVersion>;
  listContractVersions(contractId: number): Promise<ContractVersion[]>;
  getLatestContractVersion(contractId: number): Promise<ContractVersion | undefined>;

  // Contract Approvals
  createContractApproval(approval: InsertContractApproval): Promise<ContractApproval>;
  updateContractApproval(
    id: number, 
    update: { status: string; feedback?: string; actionDate: Date }
  ): Promise<ContractApproval | undefined>;
  getContractApproval(id: number): Promise<ContractApproval | undefined>;
  listContractApprovals(contractId: number): Promise<ContractApproval[]>;
  listPendingApprovalsByUser(approverId: number): Promise<ContractWithApproval[]>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  listActivityLogsByContract(contractId: number): Promise<ActivityLog[]>;
  listRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private templateMap: Map<number, ContractTemplate>;
  private contractMap: Map<number, Contract>;
  private versionMap: Map<number, ContractVersion>;
  private approvalMap: Map<number, ContractApproval>;
  private activityLogMap: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private templateIdCounter: number;
  private contractIdCounter: number;
  private versionIdCounter: number;
  private approvalIdCounter: number;
  private activityLogIdCounter: number;

  public sessionStore: session.Store;

  constructor() {
    this.userMap = new Map();
    this.templateMap = new Map();
    this.contractMap = new Map();
    this.versionMap = new Map();
    this.approvalMap = new Map();
    this.activityLogMap = new Map();
    
    this.userIdCounter = 1;
    this.templateIdCounter = 1;
    this.contractIdCounter = 1;
    this.versionIdCounter = 1;
    this.approvalIdCounter = 1;
    this.activityLogIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });

    // Initialize with some default templates
    this.seedDefaultTemplates();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.userMap.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.userMap.values());
  }

  // Contract Templates
  async getTemplate(id: number): Promise<ContractTemplate | undefined> {
    return this.templateMap.get(id);
  }

  async getTemplateByName(name: string): Promise<ContractTemplate | undefined> {
    return Array.from(this.templateMap.values()).find(
      (template) => template.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    const id = this.templateIdCounter++;
    const template: ContractTemplate = { ...insertTemplate, id };
    this.templateMap.set(id, template);
    return template;
  }

  async listTemplates(): Promise<ContractTemplate[]> {
    return Array.from(this.templateMap.values());
  }

  // Contracts
  async getContract(id: number): Promise<Contract | undefined> {
    return this.contractMap.get(id);
  }

  async getContractWithMeta(id: number): Promise<ContractWithMeta | undefined> {
    const contract = this.contractMap.get(id);
    if (!contract) return undefined;
    
    const user = this.userMap.get(contract.createdBy);
    
    return {
      ...contract,
      createdByUser: user ? {
        username: user.username,
        fullName: user.fullName
      } : undefined
    };
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.contractIdCounter++;
    const contract: Contract = { ...insertContract, id };
    this.contractMap.set(id, contract);
    
    // Create initial version
    await this.createContractVersion({
      contractId: id,
      content: insertContract.content,
      changedBy: insertContract.createdBy,
      changeDescription: "Initial version"
    });
    
    return contract;
  }

  async updateContract(id: number, update: Partial<InsertContract>): Promise<Contract | undefined> {
    const contract = this.contractMap.get(id);
    if (!contract) return undefined;
    
    const updatedContract = { ...contract, ...update };
    this.contractMap.set(id, updatedContract);
    
    return updatedContract;
  }

  async listContracts(): Promise<Contract[]> {
    return Array.from(this.contractMap.values());
  }

  async listContractsWithMeta(): Promise<ContractWithMeta[]> {
    const contracts = Array.from(this.contractMap.values());
    return contracts.map(contract => {
      const user = this.userMap.get(contract.createdBy);
      return {
        ...contract,
        createdByUser: user ? {
          username: user.username,
          fullName: user.fullName
        } : undefined
      };
    });
  }

  async listContractsByUser(userId: number): Promise<Contract[]> {
    return Array.from(this.contractMap.values()).filter(
      contract => contract.createdBy === userId
    );
  }

  async listContractsByStatus(status: string): Promise<Contract[]> {
    return Array.from(this.contractMap.values()).filter(
      contract => contract.status === status
    );
  }

  async searchContracts(query: string): Promise<Contract[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.contractMap.values()).filter(contract => 
      contract.name.toLowerCase().includes(lowercaseQuery) ||
      (contract.description && contract.description.toLowerCase().includes(lowercaseQuery)) ||
      contract.parties.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Contract Versions
  async createContractVersion(insertVersion: InsertContractVersion): Promise<ContractVersion> {
    const id = this.versionIdCounter++;
    const version: ContractVersion = { 
      ...insertVersion, 
      id, 
      changedAt: new Date() 
    };
    this.versionMap.set(id, version);
    return version;
  }

  async listContractVersions(contractId: number): Promise<ContractVersion[]> {
    return Array.from(this.versionMap.values())
      .filter(version => version.contractId === contractId)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  }

  async getLatestContractVersion(contractId: number): Promise<ContractVersion | undefined> {
    const versions = await this.listContractVersions(contractId);
    return versions.length > 0 ? versions[0] : undefined;
  }

  // Contract Approvals
  async createContractApproval(insertApproval: InsertContractApproval): Promise<ContractApproval> {
    const id = this.approvalIdCounter++;
    const approval: ContractApproval = { 
      ...insertApproval, 
      id, 
      actionDate: undefined,
      requestedAt: new Date() 
    };
    this.approvalMap.set(id, approval);
    return approval;
  }

  async updateContractApproval(
    id: number, 
    update: { status: string; feedback?: string; actionDate: Date }
  ): Promise<ContractApproval | undefined> {
    const approval = this.approvalMap.get(id);
    if (!approval) return undefined;
    
    const updatedApproval = { ...approval, ...update };
    this.approvalMap.set(id, updatedApproval);
    
    return updatedApproval;
  }

  async getContractApproval(id: number): Promise<ContractApproval | undefined> {
    return this.approvalMap.get(id);
  }

  async listContractApprovals(contractId: number): Promise<ContractApproval[]> {
    return Array.from(this.approvalMap.values())
      .filter(approval => approval.contractId === contractId)
      .sort((a, b) => {
        if (!a.actionDate && !b.actionDate) {
          return b.requestedAt.getTime() - a.requestedAt.getTime();
        }
        if (!a.actionDate) return -1;
        if (!b.actionDate) return 1;
        return b.actionDate.getTime() - a.actionDate.getTime();
      });
  }

  async listPendingApprovalsByUser(approverId: number): Promise<ContractWithApproval[]> {
    const pendingApprovals = Array.from(this.approvalMap.values())
      .filter(approval => 
        approval.approverId === approverId && 
        approval.status === "Pending"
      );
    
    const result: ContractWithApproval[] = [];
    
    for (const approval of pendingApprovals) {
      const contract = await this.getContractWithMeta(approval.contractId);
      if (contract) {
        const allApprovals = await this.listContractApprovals(approval.contractId);
        
        const approvalsWithUsers = await Promise.all(
          allApprovals.map(async a => {
            const approver = await this.getUser(a.approverId);
            return {
              ...a,
              approver: approver ? {
                username: approver.username,
                fullName: approver.fullName
              } : { username: "Unknown", fullName: "Unknown User" }
            };
          })
        );
        
        result.push({
          ...contract,
          approvals: approvalsWithUsers
        });
      }
    }
    
    return result;
  }

  // Activity Logs
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const log: ActivityLog = { 
      ...insertLog, 
      id, 
      timestamp: new Date() 
    };
    this.activityLogMap.set(id, log);
    return log;
  }

  async listActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async listActivityLogsByContract(contractId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogMap.values())
      .filter(log => log.contractId === contractId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async listRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return Array.from(this.activityLogMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Helper methods
  private async seedDefaultTemplates() {
    const ndaTemplate = {
      name: "NDA",
      description: "Standard Non-Disclosure Agreement for protecting confidential information.",
      content: `
# NON-DISCLOSURE AGREEMENT

## 1. PARTIES
This Non-Disclosure Agreement (the "Agreement") is entered into between [PARTY A] ("Disclosing Party") and [PARTY B] ("Receiving Party"), collectively referred to as the "Parties."

## 2. PURPOSE
The Parties wish to explore a potential business relationship. In connection with this opportunity, the Disclosing Party may share certain confidential and proprietary information with the Receiving Party.

## 3. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally or by inspection of tangible objects, which is designated as "Confidential," "Proprietary," or some similar designation, or that should reasonably be understood to be confidential given the nature of the information and the circumstances of disclosure.

## 4. OBLIGATIONS
The Receiving Party shall:
a) Maintain the confidentiality of the Confidential Information;
b) Not disclose any Confidential Information to any third party;
c) Use the Confidential Information only for the purpose of evaluating the potential business relationship;
d) Take reasonable measures to protect the secrecy of the Confidential Information.

## 5. TERM
This Agreement shall remain in effect for a period of [TERM] years from the Effective Date.

## 6. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

## 7. EFFECTIVE DATE
This Agreement is effective as of [EFFECTIVE DATE].

AGREED AND ACCEPTED:

[PARTY A]
By: _____________________
Name: 
Title: 
Date: 

[PARTY B]
By: _____________________
Name: 
Title: 
Date: 
      `
    };

    const salesAgreementTemplate = {
      name: "Sales Agreement",
      description: "Standard Sales Agreement for the sale of goods or services.",
      content: `
# SALES AGREEMENT

## 1. PARTIES
This Sales Agreement (the "Agreement") is entered into between [SELLER] ("Seller") and [BUYER] ("Buyer"), collectively referred to as the "Parties."

## 2. GOODS/SERVICES
The Seller agrees to sell and the Buyer agrees to purchase the following goods/services:
[DESCRIPTION OF GOODS/SERVICES]

## 3. PRICE AND PAYMENT
The price for the goods/services shall be [PRICE] plus applicable taxes. Payment shall be made as follows:
[PAYMENT TERMS]

## 4. DELIVERY
Seller shall deliver the goods/services to Buyer on or before [DELIVERY DATE] at [DELIVERY LOCATION].

## 5. WARRANTIES
Seller warrants that the goods/services shall be free from defects in material and workmanship for a period of [WARRANTY PERIOD] from the date of delivery.

## 6. LIMITATION OF LIABILITY
Seller's liability shall not exceed the purchase price of the goods/services.

## 7. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue until the obligations of both parties have been fulfilled, unless terminated earlier in accordance with this Agreement.

## 8. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

## 9. EFFECTIVE DATE
This Agreement is effective as of [EFFECTIVE DATE].

AGREED AND ACCEPTED:

[SELLER]
By: _____________________
Name: 
Title: 
Date: 

[BUYER]
By: _____________________
Name: 
Title: 
Date: 
      `
    };

    const purchaseOrderTemplate = {
      name: "Purchase Order",
      description: "Standard Purchase Order for ordering goods or services.",
      content: `
# PURCHASE ORDER

## PURCHASE ORDER NO: [PO NUMBER]
## DATE: [DATE]

## BUYER:
[BUYER NAME]
[BUYER ADDRESS]
[BUYER CONTACT INFO]

## SUPPLIER:
[SUPPLIER NAME]
[SUPPLIER ADDRESS]
[SUPPLIER CONTACT INFO]

## DELIVERY INFORMATION:
Delivery Date: [DELIVERY DATE]
Delivery Address: [DELIVERY ADDRESS]
Shipping Method: [SHIPPING METHOD]

## PAYMENT TERMS:
[PAYMENT TERMS]

## ITEMS:

| Item No. | Description | Quantity | Unit Price | Total |
|----------|-------------|----------|------------|-------|
| 1        | [ITEM 1]    | [QTY 1]  | [PRICE 1]  | [TOTAL 1] |
| 2        | [ITEM 2]    | [QTY 2]  | [PRICE 2]  | [TOTAL 2] |
| 3        | [ITEM 3]    | [QTY 3]  | [PRICE 3]  | [TOTAL 3] |

Subtotal: [SUBTOTAL]
Tax: [TAX]
Shipping: [SHIPPING]
**TOTAL**: [GRAND TOTAL]

## SPECIAL INSTRUCTIONS:
[SPECIAL INSTRUCTIONS]

## AUTHORIZATION:

Authorized by: _____________________
Name: 
Title: 
Date: 

## ACCEPTANCE:
By accepting this Purchase Order, the Supplier agrees to the terms and conditions stated herein.

Accepted by: _____________________
Name: 
Title: 
Date: 
      `
    };

    await this.createTemplate(ndaTemplate);
    await this.createTemplate(salesAgreementTemplate);
    await this.createTemplate(purchaseOrderTemplate);
  }
}

// Import the DatabaseStorage class
import { DatabaseStorage } from "./database-storage";

// Initialize database storage instance
export const storage = new DatabaseStorage();
