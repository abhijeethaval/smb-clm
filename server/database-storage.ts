import { 
  users, User, InsertUser,
  contracts, Contract, InsertContract,
  contractTemplates, ContractTemplate, InsertContractTemplate,
  contractVersions, ContractVersion, InsertContractVersion,
  contractApprovals, ContractApproval, InsertContractApproval,
  activityLogs, ActivityLog, InsertActivityLog,
  ContractWithMeta, ContractWithApproval
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Contract Templates
  async getTemplate(id: number): Promise<ContractTemplate | undefined> {
    const [template] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    return template;
  }

  async getTemplateByName(name: string): Promise<ContractTemplate | undefined> {
    const [template] = await db.select().from(contractTemplates).where(eq(contractTemplates.name, name));
    return template;
  }

  async createTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    const [template] = await db.insert(contractTemplates).values(insertTemplate).returning();
    return template;
  }

  async listTemplates(): Promise<ContractTemplate[]> {
    return await db.select().from(contractTemplates);
  }

  // Contracts
  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async getContractWithMeta(id: number): Promise<ContractWithMeta | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    
    if (!contract) return undefined;
    
    const [creator] = await db.select({
      username: users.username,
      fullName: users.fullName
    }).from(users).where(eq(users.id, contract.createdBy));
    
    return {
      ...contract,
      createdByUser: creator
    };
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values(insertContract).returning();
    return contract;
  }

  async updateContract(id: number, update: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updatedContract] = await db.update(contracts)
      .set(update)
      .where(eq(contracts.id, id))
      .returning();
    
    return updatedContract;
  }

  async listContracts(): Promise<Contract[]> {
    return await db.select().from(contracts);
  }

  async listContractsWithMeta(): Promise<ContractWithMeta[]> {
    const allContracts = await db.select().from(contracts);
    // Convert Set to Array for compatibility
    const userIds = Array.from(new Set(allContracts.map(c => c.createdBy)));
    
    const userMap = new Map<number, { username: string; fullName: string }>();
    
    for (const userId of userIds) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName
      }).from(users).where(eq(users.id, userId));
      
      if (user) userMap.set(userId, user);
    }
    
    return allContracts.map(contract => {
      const creator = userMap.get(contract.createdBy);
      return {
        ...contract,
        createdByUser: creator || undefined
      };
    });
  }

  async listContractsByUser(userId: number): Promise<Contract[]> {
    return await db.select()
      .from(contracts)
      .where(eq(contracts.createdBy, userId));
  }

  async listContractsByStatus(status: string): Promise<Contract[]> {
    // Cast the status string to the appropriate type
    const validStatus = status as "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Executed" | "Expired";
    return await db.select()
      .from(contracts)
      .where(eq(contracts.status, validStatus));
  }

  async searchContracts(query: string): Promise<Contract[]> {
    return await db.select()
      .from(contracts)
      .where(
        like(contracts.name, `%${query}%`)
      );
  }

  // Contract Versions
  async createContractVersion(insertVersion: InsertContractVersion): Promise<ContractVersion> {
    const [version] = await db.insert(contractVersions)
      .values(insertVersion)
      .returning();
    
    return version;
  }

  async listContractVersions(contractId: number): Promise<ContractVersion[]> {
    return await db.select()
      .from(contractVersions)
      .where(eq(contractVersions.contractId, contractId))
      .orderBy(desc(contractVersions.changedAt));
  }

  async getLatestContractVersion(contractId: number): Promise<ContractVersion | undefined> {
    const [version] = await db.select()
      .from(contractVersions)
      .where(eq(contractVersions.contractId, contractId))
      .orderBy(desc(contractVersions.changedAt))
      .limit(1);
    
    return version;
  }

  // Contract Approvals
  async createContractApproval(insertApproval: InsertContractApproval): Promise<ContractApproval> {
    const [approval] = await db.insert(contractApprovals)
      .values(insertApproval)
      .returning();
    
    return approval;
  }

  async updateContractApproval(
    id: number, 
    update: { status: string; feedback?: string; actionDate: Date }
  ): Promise<ContractApproval | undefined> {
    // Cast status to the correct type for the database
    const validStatus = update.status as "Approved" | "Rejected" | "Pending";
    
    const [updatedApproval] = await db.update(contractApprovals)
      .set({
        status: validStatus,
        feedback: update.feedback || null,
        actionDate: update.actionDate
      })
      .where(eq(contractApprovals.id, id))
      .returning();
    
    return updatedApproval;
  }

  async getContractApproval(id: number): Promise<ContractApproval | undefined> {
    const [approval] = await db.select()
      .from(contractApprovals)
      .where(eq(contractApprovals.id, id));
    
    return approval;
  }

  async listContractApprovals(contractId: number): Promise<ContractApproval[]> {
    return await db.select()
      .from(contractApprovals)
      .where(eq(contractApprovals.contractId, contractId));
  }

  async listPendingApprovalsByUser(approverId: number): Promise<ContractWithApproval[]> {
    // Get all pending approvals for this approver
    const pendingApprovals = await db.select()
      .from(contractApprovals)
      .where(
        and(
          eq(contractApprovals.approverId, approverId),
          eq(contractApprovals.status, "Pending")
        )
      );
    
    const result: ContractWithApproval[] = [];
    
    // Get contract details for each approval
    for (const approval of pendingApprovals) {
      const contractId = approval.contractId;
      const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
      
      if (contract) {
        // Get user info for the contract creator
        const [creator] = await db.select({
          username: users.username,
          fullName: users.fullName
        }).from(users).where(eq(users.id, contract.createdBy));
        
        // Get all approvals for this contract
        const allApprovals = await db.select().from(contractApprovals)
          .where(eq(contractApprovals.contractId, contractId));
        
        // Enrich approvals with approver info
        const enrichedApprovals = [];
        for (const appr of allApprovals) {
          const [approver] = await db.select({
            username: users.username,
            fullName: users.fullName
          }).from(users).where(eq(users.id, appr.approverId));
          
          enrichedApprovals.push({
            ...appr,
            approver
          });
        }
        
        result.push({
          ...contract,
          createdByUser: creator,
          approvals: enrichedApprovals
        });
      }
    }
    
    return result;
  }

  // Activity Logs
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs)
      .values(insertLog)
      .returning();
    
    return log;
  }

  async listActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async listActivityLogsByContract(contractId: number): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.contractId, contractId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async listRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }
}