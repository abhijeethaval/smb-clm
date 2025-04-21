import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractVersion, User } from "@shared/schema";
import { GitBranch, GitMerge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ContractHistoryProps {
  versions: ContractVersion[];
  users: Record<number, User>;
  currentContent: string;
  onViewVersion: (content: string) => void;
  onRestoreVersion: (version: ContractVersion) => void;
  isLoading: boolean;
}

export function ContractHistory({
  versions,
  users,
  currentContent,
  onViewVersion,
  onRestoreVersion,
  isLoading
}: ContractHistoryProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <GitBranch className="mr-2 h-5 w-5" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : versions.length > 0 ? (
          <div className="space-y-4">
            {/* Current version */}
            <div className="flex items-start gap-4 border-l-2 border-primary pl-4 pb-6 relative">
              <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Current Version</div>
                <div className="text-xs text-gray-500">Now</div>
              </div>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewVersion(currentContent)}
                >
                  View
                </Button>
              </div>
            </div>
            
            {/* Version history */}
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-start gap-4 border-l-2 border-gray-300 pl-4 pb-6 relative"
              >
                <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {version.changeDescription || "Updated contract"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(version.changedAt)} by{" "}
                    {users[version.changedBy]?.fullName || "Unknown user"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewVersion(version.content)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRestoreVersion(version)}
                  >
                    <GitMerge className="mr-1 h-3 w-3" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No version history available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
