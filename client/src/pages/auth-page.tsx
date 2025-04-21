import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Login form schema
const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().min(2, { message: "Full name is required" }),
  role: z.enum(["Author", "Approver"], { message: "Please select a role" }),
});

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation, refetchUser } = useAuth();
  const { toast } = useToast();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    console.log("Auth page - Current user:", user);
    if (user) {
      console.log("Auth page - Redirecting to dashboard");
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "Author",
    },
  });

  // Handle login form submission
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values, {
      onSuccess: async () => {
        console.log("Login successful, refreshing user data");
        await refetchUser();
        console.log("User data refreshed, redirecting to dashboard");
        navigate("/");
      }
    });
  }

  // Handle registration form submission
  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    // Calculate initials from full name for avatar display
    const nameParts = values.fullName.split(' ');
    const initials = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : values.fullName.substring(0, 2).toUpperCase();
    
    registerMutation.mutate({...values, initials}, {
      onSuccess: async () => {
        console.log("Registration successful, refreshing user data");
        await refetchUser();
        console.log("User data refreshed, redirecting to dashboard");
        navigate("/");
      }
    });
  }

  // Quick login buttons for demo accounts
  const handleQuickLogin = (type: 'author' | 'approver') => {
    const credentials = type === 'author' 
      ? { username: 'author@example.com', password: 'author123' } 
      : { username: 'approver@example.com', password: 'approver123' };
    
    loginMutation.mutate(credentials, {
      onSuccess: async () => {
        console.log("Quick login successful, refreshing user data");
        await refetchUser();
        console.log("User data refreshed, redirecting to dashboard");
        navigate("/");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      {/* Left section: Authentication forms */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <FileText className="text-primary mr-2 h-6 w-6" />
              <span className="text-2xl font-bold text-primary">SMB-CLM</span>
            </div>
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Contract Lifecycle Management for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                        </>
                      ) : "Login"}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6">
                  <Label className="text-sm text-center block mb-2">Quick login for demo:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleQuickLogin('author')}
                      disabled={loginMutation.isPending}
                    >
                      Author
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleQuickLogin('approver')}
                      disabled={loginMutation.isPending}
                    >
                      Approver
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Author" id="author" />
                                <Label htmlFor="author">Author</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Approver" id="approver" />
                                <Label htmlFor="approver">Approver</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
                        </>
                      ) : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right section: Hero/info */}
      <div className="md:w-1/2 bg-primary p-8 flex items-center justify-center text-white">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Contract Lifecycle Management for SMBs</h1>
          <p className="mb-6">
            Streamline your contract processes from creation to execution with our intuitive platform designed specifically for small and medium businesses.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Predefined Templates</h3>
                <p className="text-sm opacity-80">Start quickly with our library of contract templates including NDAs, Sales Agreements, and Purchase Orders.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-git-branch"><line x1="6" x2="6" y1="3" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
              </div>
              <div>
                <h3 className="font-medium">Version Control</h3>
                <p className="text-sm opacity-80">Track changes, manage versions, and maintain a complete audit trail of your contracts.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-thumbs-up"><path d="M17 21H7.8a4 4 0 0 1-3.99-3.8L2.7 8.6a4 4 0 0 1 3.9-4.6H9"></path><path d="M9 5.8V3a1 1 0 0 1 1-1l1.74.5c.83.24 1.3 1.11 1.26 1.95V7.5a2.5 2.5 0 0 1-2.5 2.5h-2"></path><path d="M7.8 21A4 4 0 0 0 11 17.5V17"></path><path d="M22 10.7c0-.83-.68-1.5-1.5-1.5h-7.67c-.62 0-1.25-.18-1.76-.52l-.53-.36"></path><path d="M20 10.7v7.05c0 1.79-1.97 2.88-3.56 1.96l-1-.58a4 4 0 0 0-3.75-.13l-.79.33"></path></svg>
              </div>
              <div>
                <h3 className="font-medium">Approval Workflow</h3>
                <p className="text-sm opacity-80">Streamlined review and approval process with feedback capabilities for efficient collaboration.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-output"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M4 12h8"></path><path d="M8 16l-4-4 4-4"></path></svg>
              </div>
              <div>
                <h3 className="font-medium">Export & Share</h3>
                <p className="text-sm opacity-80">Generate professional PDF documents for your finalized contracts to share with stakeholders.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
