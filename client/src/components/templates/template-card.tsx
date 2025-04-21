import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContractTemplate } from "@shared/schema";
import { FileText, PlusCircle } from "lucide-react";

interface TemplateCardProps {
  template: ContractTemplate;
  onSelect: () => void;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  // Get template type icon
  const getTemplateIcon = (name: string) => {
    switch (name) {
      case "NDA":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary mr-2">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            <path d="M8.5 9.5 6 11V3h12v18h-9"/>
          </svg>
        );
      case "Sales Agreement":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary mr-2">
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
            <path d="M9 22v-4h6v4"/>
            <path d="M8 10h8"/>
            <path d="M8 6h8"/>
            <path d="M8 14h8"/>
          </svg>
        );
      case "Purchase Order":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary mr-2">
            <path d="M12 12H3"/>
            <path d="M16 6H3"/>
            <path d="M12 18H3"/>
            <path d="M14.5 13.5l2-3"/>
            <path d="M14.5 10.5l-2-3"/>
            <path d="M20 12l2 3"/>
            <path d="M22 15l-2-3"/>
          </svg>
        );
      default:
        return <FileText className="h-5 w-5 text-primary mr-2" />;
    }
  };

  // Get template preview (first few lines of content)
  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return "No content available";
    
    // Get first line (title) and some content
    const title = lines[0].replace(/^#\s+/, '');
    const preview = lines.slice(1, 3).join(' ').substring(0, 120);
    
    return preview ? `${preview}...` : title;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          {getTemplateIcon(template.name)}
          {template.name}
        </CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">
          {getPreview(template.content)}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onSelect}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
