import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Edit2, Loader2, Mail, UserCircle } from "lucide-react";

interface UserProfileProps {
  user: User | null;
}

export function UserProfile({ user }: UserProfileProps) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.username || "");
  const [isEditing, setIsEditing] = useState(false);

  // This would be a real API call in a production app
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string }) => {
      // Simulate API call
      return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error updating profile",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ fullName, email });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500">User information not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your personal information and account settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-2xl bg-primary text-white">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-medium">{user.fullName}</h3>
            <p className="text-sm text-gray-500">{user.username}</p>
            <div className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
              {user.role}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Role
            </Label>
            <Input
              value={user.role}
              disabled
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
