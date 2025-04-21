import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContractWithMeta } from "@shared/schema";

interface ContractEditorProps {
  contract: ContractWithMeta;
  onSave: (content: string, changeDescription: string) => Promise<void>;
  isSaving: boolean;
  readOnly?: boolean;
}

export function ContractEditor({ 
  contract, 
  onSave, 
  isSaving,
  readOnly = false
}: ContractEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(contract.content);
  const [changeDescription, setChangeDescription] = useState("");
  const [activeTab, setActiveTab] = useState<string>("edit");
  
  const handleSave = async () => {
    if (!changeDescription) {
      toast({
        title: "Change description required",
        description: "Please provide a brief description of your changes.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onSave(content, changeDescription);
      setChangeDescription("");
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const renderPreview = () => {
    // Simple Markdown-like renderer
    const html = content
      // Headers
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Paragraphs
      .replace(/^\s*$/gim, '</p><p class="my-2">')
      // Tables
      .replace(/^\|(.*)\|$/gim, function(match, contents) {
        const cells = contents.split('|').map(cell => `<td class="border px-2 py-1">${cell.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      });
      
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Editor</CardTitle>
      </CardHeader>
      <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
        <CardContent>
          <TabsList className="mb-4">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono"
              placeholder="Enter contract content..."
              readOnly={readOnly}
            />
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="border p-4 min-h-[400px] bg-white rounded-md overflow-y-auto">
              {renderPreview()}
            </div>
          </TabsContent>
        </CardContent>
        
        {!readOnly && (
          <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              className="flex-1"
              placeholder="Briefly describe your changes..."
            />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Tabs>
    </Card>
  );
}
