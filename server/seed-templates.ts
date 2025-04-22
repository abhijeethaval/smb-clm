import { storage } from "./storage";
import { getDefaultContentForTemplate } from "../client/src/lib/contract-templates";

export async function seedDefaultTemplates() {
  console.log("Checking for default templates...");
  
  // Check if templates already exist
  const existingTemplates = await storage.listTemplates();
  
  if (existingTemplates.length === 0) {
    console.log("No templates found, creating default templates");
    
    // Create NDA template
    await storage.createTemplate({
      name: "Non-Disclosure Agreement",
      description: "Standard Non-Disclosure Agreement for protecting confidential information.",
      content: getDefaultContentForTemplate("NDA")
    });
    
    // Create Sales Agreement template
    await storage.createTemplate({
      name: "Sales Agreement",
      description: "Standard Sales Agreement for the sale of goods or services.",
      content: getDefaultContentForTemplate("Sales Agreement")
    });
    
    // Create Purchase Order template
    await storage.createTemplate({
      name: "Purchase Order",
      description: "Standard Purchase Order for procuring goods or services.",
      content: getDefaultContentForTemplate("Purchase Order")
    });
    
    console.log("Default templates created successfully");
  } else {
    console.log(`Found ${existingTemplates.length} existing templates, skipping seed`);
  }
}