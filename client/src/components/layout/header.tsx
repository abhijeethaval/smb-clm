import { useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Settings, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export function Header() {
  const isMobile = useMobile();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { user, logoutMutation } = useAuth();
  const [notificationCount] = useState(3); // This would come from an API in a real app
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    // We need to dispatch an event to notify the sidebar
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Redirect to auth page after successful logout
        navigate("/auth");
      }
    });
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm z-10">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-neutral-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/">
            <a className="flex items-center">
              <FileText className="text-primary mr-2 h-5 w-5" />
              <h1 className="text-xl font-medium text-primary">SMB-CLM</h1>
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-neutral-700">
              <Bell className="h-5 w-5" />
            </Button>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-white">
                    {user?.initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{user?.fullName || "User"}</div>
                  <div className="text-xs text-neutral-500">{user?.role || "Role"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <a className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="text-red-500 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}


