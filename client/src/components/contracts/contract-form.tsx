import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ContractTemplate, insertContractSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { getDefaultContentForTemplate, fillTemplateWithValues } from "@/lib/contract-templates";

interface ContractFormProps {
  templates: ContractTemplate[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  defaultValues?: any;
  mode?: 'create' | 'edit';
}

export function ContractForm({ 
  templates, 
  onSubmit, 
  isSubmitting,
  defaultValues = {},
  mode = 'create'
}: ContractFormProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultValues.templateId || "");
  
  // Create a schema that extends the insert schema with some validation
  const formSchema = insertContractSchema.extend({
    templateId: z.string().optional(),
    name: z.string().min(3, "Contract name must be at least 3 characters"),
    description: z.string().optional(),
    parties: z.string().min(1, "Parties involved is required"),
    effectiveDate: z.string().optional(),
    expiryDate: z.string().optional(),
    contractValue: z.union([z.number().positive(), z.string()]).optional(),
  }).omit({ createdBy: true, createdAt: true, status: true });

  // Set up the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues.name || "",
      description: defaultValues.description || "",
      parties: defaultValues.parties || "",
      effectiveDate: defaultValues.effectiveDate ? new Date(defaultValues.effectiveDate).toISOString().split('T')[0] : "",
      expiryDate: defaultValues.expiryDate ? new Date(defaultValues.expiryDate).toISOString().split('T')[0] : "",
      contractValue: defaultValues.contractValue || "",
      content: defaultValues.content || "",
      templateId: defaultValues.templateId || "",
    },
  });

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId && mode === 'create') {
      const selectedTemplate = templates.find(t => t.id.toString() === templateId);
      if (selectedTemplate) {
        form.setValue("content", selectedTemplate.content);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      // Convert contractValue to number if present
      if (data.contractValue) {
        if (typeof data.contractValue === 'string') {
          // Remove currency symbol and commas
          const cleanValue = data.contractValue.replace(/[$,]/g, '');
          data.contractValue = parseFloat(cleanValue);
        }
      }

      // Convert dates to ISO format
      if (data.effectiveDate) {
        data.effectiveDate = new Date(data.effectiveDate).toISOString();
      }
      
      if (data.expiryDate) {
        data.expiryDate = new Date(data.expiryDate).toISOString();
      }

      // Submit the form
      onSubmit({
        ...data,
        templateId: data.templateId ? parseInt(data.templateId) : undefined,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem with your submission. Please check your input.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <FormControl>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTemplateChange(e);
                        }}
                      >
                        <option value="">Select a template...</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contract name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter contract description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parties Involved</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter parties involved" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contractValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Value</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                      <Input 
                        type="text" 
                        className="pl-8" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter contract content" 
                      className="min-h-[300px] font-mono"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" type="button" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Draft' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
