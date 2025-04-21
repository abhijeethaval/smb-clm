import { Contract, ContractWithMeta } from "@shared/schema";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Extend jsPDF to include the autoTable method from jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportOptions {
  includeMetadata?: boolean;
  includeHistory?: boolean;
  includeApprovals?: boolean;
}

export async function generateContractPDF(
  contract: ContractWithMeta, 
  options: ExportOptions = {}
): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Set up fonts
  doc.setFont("helvetica");
  
  // Add header with contract name
  doc.setFontSize(20);
  doc.setTextColor(27, 118, 210); // primary color
  doc.text(contract.name, 20, 20);
  
  // Add metadata
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  
  let yPosition = 30;
  
  if (options.includeMetadata !== false) {
    // Contract metadata
    doc.setFontSize(14);
    doc.text("Contract Details", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Description: ${contract.description || "N/A"}`, 20, yPosition);
    yPosition += 7;
    
    doc.text(`Parties: ${contract.parties}`, 20, yPosition);
    yPosition += 7;
    
    doc.text(`Effective Date: ${contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : "N/A"}`, 20, yPosition);
    yPosition += 7;
    
    doc.text(`Expiry Date: ${contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : "N/A"}`, 20, yPosition);
    yPosition += 7;
    
    doc.text(`Contract Value: ${contract.contractValue ? `$${contract.contractValue.toLocaleString()}` : "N/A"}`, 20, yPosition);
    yPosition += 7;
    
    doc.text(`Status: ${contract.status}`, 20, yPosition);
    yPosition += 7;
    
    if (contract.createdByUser) {
      doc.text(`Created By: ${contract.createdByUser.fullName}`, 20, yPosition);
      yPosition += 7;
    }
    
    doc.text(`Creation Date: ${new Date(contract.createdAt).toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;
  }
  
  // Add main content
  doc.setFontSize(14);
  doc.text("Contract Content", 20, yPosition);
  yPosition += 10;
  
  // Process contract content (could be Markdown, HTML, or plain text)
  const contentLines = contract.content.split('\n');
  doc.setFontSize(10);
  
  for (const line of contentLines) {
    if (line.startsWith('#')) {
      // Heading
      const headingLevel = line.match(/^#+/)?.[0].length || 1;
      const headingText = line.replace(/^#+\s+/, '');
      
      doc.setFontSize(16 - headingLevel * 2);
      doc.setFont("helvetica", "bold");
      
      doc.text(headingText, 20, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    } else if (line.trim() === '') {
      // Empty line
      yPosition += 3;
    } else {
      // Normal text - wrap long lines
      const textLines = doc.splitTextToSize(line, 170);
      doc.text(textLines, 20, yPosition);
      yPosition += 5 * textLines.length;
    }
    
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
  }
  
  // Add signature block
  yPosition += 20;
  
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(12);
  doc.text("Signatures", 20, yPosition);
  yPosition += 10;
  
  doc.line(20, yPosition, 90, yPosition);
  doc.line(110, yPosition, 180, yPosition);
  yPosition += 5;
  
  doc.setFontSize(10);
  doc.text("Party A Signature", 20, yPosition);
  doc.text("Party B Signature", 110, yPosition);
  yPosition += 15;
  
  doc.line(20, yPosition, 90, yPosition);
  doc.line(110, yPosition, 180, yPosition);
  yPosition += 5;
  
  doc.text("Date", 20, yPosition);
  doc.text("Date", 110, yPosition);
  
  // Generate blob from the PDF document
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}

export function downloadContractPDF(
  contract: ContractWithMeta, 
  options: ExportOptions = {}
): Promise<void> {
  return generateContractPDF(contract, options).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contract.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
