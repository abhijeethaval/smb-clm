import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "@/components/settings/user-profile";
import { Settings, User, BellRing, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [contractExpiryAlerts, setContractExpiryAlerts] = useState(true);
  const [approvalReminderAlerts, setApprovalReminderAlerts] = useState(true);

  const handleSaveNotificationSettings = () => {
    // In a real implementation, this would save to the server
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated",
    });
  };

  const handleSaveSecuritySettings = () => {
    // In a real implementation, this would save to the server
    toast({
      title: "Settings saved",
      description: "Your security settings have been updated",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <BellRing className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <UserProfile user={user} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications from the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Browser Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications in the browser</p>
                    </div>
                    <Switch
                      checked={browserNotifications}
                      onCheckedChange={setBrowserNotifications}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h4 className="font-medium">Alert Types</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Contract Expiry Alerts</p>
                      <p className="text-xs text-gray-500">Get notifications when contracts are about to expire</p>
                    </div>
                    <Switch
                      checked={contractExpiryAlerts}
                      onCheckedChange={setContractExpiryAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Approval Reminder Alerts</p>
                      <p className="text-xs text-gray-500">Get reminders for pending approvals</p>
                    </div>
                    <Switch
                      checked={approvalReminderAlerts}
                      onCheckedChange={setApprovalReminderAlerts}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotificationSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <input
                    id="current-password"
                    type="password"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <input
                    id="new-password"
                    type="password"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSecuritySettings}>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { Separator } from "@/components/ui/separator";
