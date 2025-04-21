import { Card } from "@/components/ui/card";
import {
  AlarmClock,
  CheckCircle,
  Edit,
  Hourglass,
  PlayCircle,
  XCircle
} from "lucide-react";

type StatusCardProps = {
  status: string;
  count: number;
  change?: number;
};

export function StatusCard({ status, count, change }: StatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "text-blue-500 bg-blue-50";
      case "Pending":
        return "text-orange-500 bg-orange-50";
      case "Approved":
        return "text-green-500 bg-green-50";
      case "Rejected":
        return "text-red-500 bg-red-50";
      case "Executed":
        return "text-purple-500 bg-purple-50";
      case "Expired":
        return "text-gray-500 bg-gray-50";
      case "Expiring":
        return "text-red-500 bg-red-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <Edit className="text-blue-500" />;
      case "Pending":
        return <Hourglass className="text-orange-500" />;
      case "Approved":
        return <CheckCircle className="text-green-500" />;
      case "Rejected":
        return <XCircle className="text-red-500" />;
      case "Executed":
        return <PlayCircle className="text-purple-500" />;
      case "Expired":
        return <AlarmClock className="text-gray-500" />;
      case "Expiring":
        return <AlarmClock className="text-red-500" />;
      default:
        return <AlarmClock className="text-gray-500" />;
    }
  };

  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  return (
    <Card className="bg-white p-4 rounded-md shadow-sm border border-neutral-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{status}</p>
          <h3 className="text-2xl font-medium">{count}</h3>
        </div>
        <div className={`w-8 h-8 rounded-full ${statusColor} flex items-center justify-center`}>
          {statusIcon}
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-2 text-xs">
          <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}
          </span>{" "}
          since last month
        </div>
      )}
    </Card>
  );
}
