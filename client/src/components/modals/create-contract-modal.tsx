import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ContractTemplate } from "@shared/schema";
import { getDefaultContentForTemplate, fillTemplateWithValues } from "@/lib/contract-templates";
import { formatDate } from "@/lib/date-utils";

const formSchema = z.object({
  templateId: z.string().optional(),
  name: z.string().min(3, "Contract name must be at least 3 characters"),
  parties: z.string().min(1, "Parties involved is required"),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  contractValue: z.string().optional(),
});

type FormInput = z.infer<typeof formSchema>;

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  templates: ContractTemplate[];
  isSubmitting: boolean;
}

export function CreateContractModal({
  isOpen,
  onClose,
  onSubmit,
  templates,
  isSubmitting,
}: CreateContractModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateId: "",
      name: "",
      parties: "",
      effectiveDate: "",
      expiryDate: "",
      contractValue: "",
    },
  });

  const templateId = watch("templateId");

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplateId = e.target.value;
    const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);
    
    // If a template was selected and found, prefill name based on template
    if (selectedTemplate) {
      setValue("name", `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`);
    }
  };

  const processFormSubmit: SubmitHandler<FormInput> = (data) => {
    const selectedTemplate = templates.find(t => t.id.toString() === data.templateId);
    
    // Parse values for contract data
    const contractValue = data.contractValue ? parseFloat(data.contractValue.replace(/[$,]/g, '')) : undefined;
    const effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : undefined;
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    
    // Extract party names from the "Parties Involved" field
    const partyNames = data.parties.split(/[,;&]|\band\b/).map(name => name.trim()).filter(Boolean);
    const party1 = partyNames[0] || "Party A";
    const party2 = partyNames[1] || "Party B";
    
    // Create a template-specific placeholder values map based on template type
    let placeholderValues: Record<string, string> = {
      // Common placeholders across all templates
      "EFFECTIVE DATE": effectiveDate ? formatDate(effectiveDate) : "TBD",
      "DATE": new Date().toLocaleDateString(),
      "JURISDICTION": "State of California, United States",
      "TERM": "2",
    };
    
    // Add template-specific placeholders
    if (selectedTemplate) {
      if (selectedTemplate.name.includes("NDA")) {
        // NDA-specific placeholders
        placeholderValues = {
          ...placeholderValues,
          "PARTY A": party1,
          "PARTY B": party2,
          "PARTIES": data.parties,
        };
      } else if (selectedTemplate.name.includes("Sales")) {
        // Sales Agreement-specific placeholders
        placeholderValues = {
          ...placeholderValues,
          "SELLER": party1,
          "BUYER": party2,
          "DELIVERY DATE": expiryDate ? formatDate(expiryDate) : "TBD",
          "DELIVERY LOCATION": "Buyer's address",
          "WARRANTY PERIOD": "90 days",
        };
      } else if (selectedTemplate.name.includes("Purchase")) {
        // Purchase Order-specific placeholders
        placeholderValues = {
          ...placeholderValues,
          "BUYER NAME": party1,
          "SUPPLIER NAME": party2,
          "DELIVERY DATE": expiryDate ? formatDate(expiryDate) : "TBD",
          "GRAND TOTAL": contractValue ? `$${contractValue.toLocaleString()}` : "TBD",
        };
      }
    }
    
    // Get and fill template content with values
    let content = "";
    if (selectedTemplate) {
      content = fillTemplateWithValues(selectedTemplate.content, placeholderValues);
    }
    
    // Prepare the contract data
    const contractData = {
      ...data,
      templateId: data.templateId ? parseInt(data.templateId) : undefined,
      content: content, 
      contractValue: contractValue,
      effectiveDate: effectiveDate ? effectiveDate.toISOString() : undefined,
      expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
      status: "Draft", // Explicitly set status to Draft to ensure consistency
    };
    
    onSubmit(contractData);
    reset();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Create a new contract by selecting a template and filling out the details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(processFormSubmit)} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <select
                id="template"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...register("templateId")}
                onChange={(e) => {
                  register("templateId").onChange(e);
                  handleTemplateChange(e);
                }}
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {errors.templateId && (
                <p className="text-red-500 text-xs mt-1">{errors.templateId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-name">Contract Name</Label>
              <Input
                id="contract-name"
                placeholder="Enter contract name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parties">Parties Involved</Label>
              <Input
                id="parties"
                placeholder="Enter party names"
                {...register("parties")}
              />
              {errors.parties && (
                <p className="text-red-500 text-xs mt-1">{errors.parties.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective-date">Effective Date</Label>
                <Input
                  id="effective-date"
                  type="date"
                  {...register("effectiveDate")}
                />
                {errors.effectiveDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.effectiveDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  {...register("expiryDate")}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-value">Contract Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                <Input
                  id="contract-value"
                  className="pl-8"
                  placeholder="0.00"
                  {...register("contractValue")}
                />
              </div>
              {errors.contractValue && (
                <p className="text-red-500 text-xs mt-1">{errors.contractValue.message}</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Draft"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
