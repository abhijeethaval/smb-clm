import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Clock, Edit, File, FileCheck, FileX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Activity = {
  id: number;
  userId: number;
  contractId?: number;
  action: string;
  details: string;
  timestamp: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
  };
  contract?: {
    id: number;
    name: string;
  };
};

type ActivityLogProps = {
  activities: Activity[];
  isLoading: boolean;
};

export function ActivityLog({ activities, isLoading }: ActivityLogProps) {
  const getActivityColor = (activity: Activity) => {
    const action = activity.action.toLowerCase();
    if (action.includes('created') || action.includes('draft')) {
      return 'border-blue-500 bg-blue-500';
    } else if (action.includes('approved')) {
      return 'border-green-500 bg-green-500';
    } else if (action.includes('rejected')) {
      return 'border-red-500 bg-red-500';
    } else if (action.includes('submitted') || action.includes('pending')) {
      return 'border-orange-500 bg-orange-500';
    } else if (action.includes('executed')) {
      return 'border-purple-500 bg-purple-500';
    } else if (action.includes('expired')) {
      return 'border-gray-500 bg-gray-500';
    } else {
      return 'border-gray-400 bg-gray-400';
    }
  };

  const getActivityIcon = (activity: Activity) => {
    const action = activity.action.toLowerCase();
    if (action.includes('created') || action.includes('draft')) {
      return <Edit size={16} />;
    } else if (action.includes('approved')) {
      return <Check size={16} />;
    } else if (action.includes('rejected')) {
      return <FileX size={16} />;
    } else if (action.includes('submitted') || action.includes('pending')) {
      return <Clock size={16} />;
    } else if (action.includes('executed')) {
      return <FileCheck size={16} />;
    } else if (action.includes('expired')) {
      return <Clock size={16} />;
    } else {
      return <File size={16} />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="bg-white rounded-md shadow-sm border border-neutral-200 h-full">
      <CardHeader className="p-4 border-b border-neutral-200">
        <h3 className="font-medium">Recent Activity</h3>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li 
                key={activity.id} 
                className={`border-l-2 pl-4 pb-4 relative ${getActivityColor(activity).replace('bg-', 'border-')}`}
              >
                <div 
                  className={`absolute w-3 h-3 rounded-full -left-[7px] top-0 ${getActivityColor(activity)}`}
                ></div>
                <div className="text-sm font-medium">
                  {activity.action}
                  {activity.contract && (
                    <>: <span className="text-primary">{activity.contract.name}</span></>
                  )}
                </div>
                <div className="text-xs text-neutral-600">{formatRelativeTime(activity.timestamp)}</div>
                {activity.details && (
                  <div className="text-xs italic bg-neutral-50 p-2 mt-1 rounded">{activity.details}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 text-neutral-500">No recent activity</div>
        )}
      </CardContent>
    </Card>
  );
}
