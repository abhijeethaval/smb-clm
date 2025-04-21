import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { 
  Contract, 
  InsertContract, 
  insertContractSchema,
  insertContractVersionSchema,
  insertContractApprovalSchema
} from "@shared/schema";

// Middleware to ensure the user is authenticated
function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if the user has a specific role
function hasRole(role: string) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Create author & approver accounts if none exist
  await seedInitialUsers();

  // Templates Routes
  app.get("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.listTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching templates" });
    }
  });

  app.get("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getTemplate(parseInt(req.params.id));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Error fetching template" });
    }
  });

  // Contracts Routes
  app.get("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.listContractsWithMeta();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contracts" });
    }
  });

  app.get("/api/contracts/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const contracts = await storage.searchContracts(query);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Error searching contracts" });
    }
  });

  app.get("/api/contracts/status/:status", isAuthenticated, async (req, res) => {
    try {
      const status = req.params.status;
      const validStatuses = ["Draft", "Pending Approval", "Approved", "Rejected", "Executed", "Expired"];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const contracts = await storage.listContractsByStatus(status);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contracts by status" });
    }
  });

  app.get("/api/contracts/user", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.listContractsByUser(req.user.id);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user contracts" });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.getContractWithMeta(parseInt(req.params.id));
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contract" });
    }
  });

  app.post("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const parsedContract = insertContractSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const contract = await storage.createContract(parsedContract);
      
      // Log activity
      await storage.createActivityLog({
        contractId: contract.id,
        userId: req.user.id,
        action: "Contract created",
        details: `Created contract "${contract.name}" from ${req.body.templateName || "scratch"}`
      });
      
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating contract" });
    }
  });

  app.put("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Check if user is the creator or an approver
      if (contract.createdBy !== req.user.id && req.user.role !== "Approver") {
        return res.status(403).json({ message: "You don't have permission to update this contract" });
      }
      
      // If content changed, create a new version
      if (req.body.content && req.body.content !== contract.content) {
        await storage.createContractVersion({
          contractId,
          content: contract.content, // Save the old version
          changedBy: req.user.id,
          changeDescription: req.body.changeDescription || "Updated contract"
        });
      }
      
      // Update the contract
      const updatedContract = await storage.updateContract(contractId, req.body);
      
      // Log activity
      await storage.createActivityLog({
        contractId,
        userId: req.user.id,
        action: "Contract updated",
        details: `Updated contract "${contract.name}"`
      });
      
      res.json(updatedContract);
    } catch (error) {
      res.status(500).json({ message: "Error updating contract" });
    }
  });

  // Contract Versions Routes
  app.get("/api/contracts/:id/versions", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const versions = await storage.listContractVersions(contractId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contract versions" });
    }
  });

  // Approval Routes
  app.post("/api/contracts/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      console.log(`Submit for approval request - Contract ID: ${contractId}, Found:`, !!contract);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Log contract details for troubleshooting
      console.log(`Contract status: "${contract.status}", Created by: ${contract.createdBy}, Current user: ${req.user.id}`);
      
      // Check if user is the creator
      if (contract.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Only the contract creator can submit for approval" });
      }
      
      // Fix for missing status - ensure we have a valid status
      if (!contract.status) {
        console.log("Contract has no status, setting to Draft before proceeding");
        await storage.updateContract(contractId, { status: "Draft" });
        // Refetch contract to get updated status
        const updatedContract = await storage.getContract(contractId);
        if (!updatedContract) {
          return res.status(500).json({ message: "Failed to update contract status" });
        }
        // Update our local reference
        contract.status = updatedContract.status;
      }
      
      // Check if already in approval process
      if (contract.status !== "Draft" && contract.status !== "Rejected") {
        return res.status(400).json({ message: `Contract is already in ${contract.status || "unknown"} status` });
      }
      
      // Get approvers
      const approvers = (await storage.listUsers()).filter(user => user.role === "Approver");
      console.log(`Found ${approvers.length} approvers for contract`);
      
      if (approvers.length === 0) {
        return res.status(400).json({ message: "No approvers available in the system" });
      }
      
      // Update contract status
      await storage.updateContract(contractId, { status: "Pending Approval" });
      
      // Create approval requests for all approvers
      for (const approver of approvers) {
        await storage.createContractApproval({
          contractId,
          approverId: approver.id,
          status: "Pending",
          feedback: null
        });
      }
      
      // Log activity
      await storage.createActivityLog({
        contractId,
        userId: req.user.id,
        action: "Contract submitted for approval",
        details: `Submitted contract "${contract.name}" for approval`
      });
      
      res.json({ message: "Contract submitted for approval" });
    } catch (error) {
      res.status(500).json({ message: "Error submitting contract for approval" });
    }
  });

  app.get("/api/approvals", isAuthenticated, hasRole("Approver"), async (req, res) => {
    try {
      const pendingContracts = await storage.listPendingApprovalsByUser(req.user.id);
      res.json(pendingContracts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending approvals" });
    }
  });

  app.post("/api/approvals/:id/review", isAuthenticated, hasRole("Approver"), async (req, res) => {
    try {
      const approvalId = parseInt(req.params.id);
      const { status, feedback } = req.body;
      
      if (status !== "Approved" && status !== "Rejected") {
        return res.status(400).json({ message: "Status must be either 'Approved' or 'Rejected'" });
      }
      
      const approval = await storage.getContractApproval(approvalId);
      
      if (!approval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      
      if (approval.approverId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to review this approval" });
      }
      
      if (approval.status !== "Pending") {
        return res.status(400).json({ message: "This approval has already been processed" });
      }
      
      // Update the approval
      const updatedApproval = await storage.updateContractApproval(approvalId, {
        status,
        feedback,
        actionDate: new Date()
      });
      
      const contract = await storage.getContract(approval.contractId);
      
      if (contract) {
        // Check if all approvals are complete
        const approvals = await storage.listContractApprovals(contract.id);
        const allApproved = approvals.every(a => a.status === "Approved");
        const anyRejected = approvals.some(a => a.status === "Rejected");
        
        // Update contract status
        if (anyRejected) {
          await storage.updateContract(contract.id, { status: "Rejected" });
        } else if (allApproved) {
          await storage.updateContract(contract.id, { status: "Approved" });
        }
        
        // Log activity
        await storage.createActivityLog({
          contractId: contract.id,
          userId: req.user.id,
          action: `Contract ${status.toLowerCase()}`,
          details: `${status} contract "${contract.name}"${feedback ? ` with feedback: ${feedback}` : ""}`
        });
      }
      
      res.json(updatedApproval);
    } catch (error) {
      res.status(500).json({ message: "Error reviewing approval" });
    }
  });

  // Activity Logs
  app.get("/api/activity", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.listRecentActivityLogs(limit);
      
      // Enrich activities with user and contract data
      const enrichedActivities = await Promise.all(activities.map(async activity => {
        const user = activity.userId ? await storage.getUser(activity.userId) : null;
        const contract = activity.contractId ? await storage.getContract(activity.contractId) : null;
        
        return {
          ...activity,
          user: user ? { id: user.id, username: user.username, fullName: user.fullName } : null,
          contract: contract ? { id: contract.id, name: contract.name } : null
        };
      }));
      
      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  });

  // Contract execution and expiration
  app.post("/api/contracts/:id/execute", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.status !== "Approved") {
        return res.status(400).json({ 
          message: "Only approved contracts can be executed" 
        });
      }
      
      // Update contract status
      await storage.updateContract(contractId, { status: "Executed" });
      
      // Log activity
      await storage.createActivityLog({
        contractId,
        userId: req.user.id,
        action: "Contract executed",
        details: `Executed contract "${contract.name}"`
      });
      
      res.json({ message: "Contract executed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error executing contract" });
    }
  });

  // Check for and update expired contracts (would typically be a cron job in production)
  app.post("/api/contracts/check-expirations", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.listContracts();
      const today = new Date();
      const expiredContracts = [];
      
      for (const contract of contracts) {
        if (contract.status === "Executed" && 
            contract.expiryDate && 
            new Date(contract.expiryDate) < today) {
          
          await storage.updateContract(contract.id, { status: "Expired" });
          
          await storage.createActivityLog({
            contractId: contract.id,
            userId: req.user.id,
            action: "Contract expired",
            details: `Contract "${contract.name}" marked as expired`
          });
          
          expiredContracts.push(contract.id);
        }
      }
      
      res.json({ 
        message: "Expiration check complete", 
        expiredContractIds: expiredContracts 
      });
    } catch (error) {
      res.status(500).json({ message: "Error checking contract expirations" });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.listContracts();
      
      // Calculate counts by status
      const statusCounts = {
        Draft: 0,
        "Pending Approval": 0,
        Approved: 0,
        Rejected: 0,
        Executed: 0,
        Expired: 0
      };
      
      contracts.forEach(contract => {
        if (statusCounts.hasOwnProperty(contract.status)) {
          statusCounts[contract.status]++;
        }
      });
      
      // Calculate contracts expiring soon (within 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const expiringSoon = contracts.filter(contract => 
        contract.status === "Executed" && 
        contract.expiryDate && 
        new Date(contract.expiryDate) > today &&
        new Date(contract.expiryDate) < thirtyDaysFromNow
      ).length;
      
      // Get recent activities
      const recentActivities = await storage.listRecentActivityLogs(5);
      
      // Enrich activities with user data
      const enrichedActivities = await Promise.all(recentActivities.map(async activity => {
        const user = activity.userId ? await storage.getUser(activity.userId) : null;
        const contract = activity.contractId ? await storage.getContract(activity.contractId) : null;
        
        return {
          ...activity,
          user: user ? { id: user.id, username: user.username, fullName: user.fullName } : null,
          contract: contract ? { id: contract.id, name: contract.name } : null
        };
      }));
      
      res.json({
        statusCounts,
        expiringSoon,
        recentActivities: enrichedActivities
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Seed initial users if none exist
async function seedInitialUsers() {
  const users = await storage.listUsers();
  
  if (users.length === 0) {
    // Create an author user
    await storage.createUser({
      username: "author@example.com",
      password: await hashPassword("author123"),
      role: "Author",
      fullName: "Author User",
      initials: "AU"
    });
    
    // Create an approver user
    await storage.createUser({
      username: "approver@example.com",
      password: await hashPassword("approver123"),
      role: "Approver",
      fullName: "Approver User",
      initials: "AP"
    });
    
    console.log("Created default users:");
    console.log("- Author: author@example.com / author123");
    console.log("- Approver: approver@example.com / approver123");
  }
}
