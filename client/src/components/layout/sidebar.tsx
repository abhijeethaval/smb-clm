import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText,
  FileCog,
  ThumbsUp,
  Settings,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";

type SidebarProps = {
  pendingCount?: number;
  recentContracts?: { id: number; name: string }[];
};

export function Sidebar({ pendingCount = 0, recentContracts = [] }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  type NavItem = {
    name: string;
    path: string;
    icon: ReactNode;
    badge?: number;
  };

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Contracts",
      path: "/contracts",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Templates",
      path: "/templates",
      icon: <FileCog className="h-5 w-5" />,
    },
  ];

  if (user?.role === "Approver") {
    navItems.push({
      name: "Approval Queue",
      path: "/approvals",
      icon: <ThumbsUp className="h-5 w-5" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    });
  }

  navItems.push({
    name: "Settings",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />,
  });

  if (isMobile && !isCollapsed) {
    return null;
  }

  return (
    <aside className={`bg-white border-r border-neutral-200 shadow-sm h-full overflow-y-auto w-[250px] ${isMobile ? (isCollapsed ? "w-0 overflow-hidden" : "w-[250px]") : ""}`}>
      <nav className="py-4">
        <div className="px-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search contracts"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={`flex items-center px-4 py-2 ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10 border-r-4 border-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                  {item.badge !== undefined && (
                    <Badge className="ml-auto bg-secondary text-white">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {recentContracts.length > 0 && (
          <div className="border-t border-neutral-200 mt-6 pt-6 px-4">
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Recent Contracts
            </h3>
            {recentContracts.map((contract) => (
              <Link key={contract.id} href={`/contract/${contract.id}`}>
                <a className="block mb-2 text-sm text-gray-700 hover:text-primary truncate">
                  {contract.name}
                </a>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
