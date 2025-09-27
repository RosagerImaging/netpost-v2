"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Link as LinkIcon,
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
  Settings as SettingsIcon,
  Smartphone,
  Mail,
  Globe,
  Key
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@netpost/ui";
import { cn } from "@netpost/ui";

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    sales: true,
    lowStock: true,
    priceChanges: false,
    marketing: false,
  });
  const [platforms, setPlatforms] = useState({
    ebay: { connected: true, status: "active", sales: 147 },
    poshmark: { connected: true, status: "active", sales: 89 },
    mercari: { connected: false, status: "disconnected", sales: 0 },
    depop: { connected: true, status: "limited", sales: 23 },
    facebook: { connected: false, status: "disconnected", sales: 0 },
  });

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSave = async () => {
    setSaveStatus("saving");
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      ebay: "🛒",
      poshmark: "👗",
      mercari: "📦",
      depop: "🎨",
      facebook: "📘"
    };
    return icons[platform] || "🔗";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent text-white">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and platform connections
            </p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="glass grid w-full grid-cols-5">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white text-lg">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or SVG. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      defaultValue="John"
                      className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      defaultValue="Doe"
                      className="glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="pst">
                    <SelectTrigger className="glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                      <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
                      <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                      <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSave} className="w-full md:w-auto">
                  {saveStatus === "saving" ? (
                    "Saving..."
                  ) : saveStatus === "saved" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about important events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Communication Channels
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Browser and mobile notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.push}
                        onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Text message alerts</p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={notifications.sms}
                        onCheckedChange={(checked) => handleNotificationChange("sms", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Business Events</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sales-notifications">Sales & Orders</Label>
                        <p className="text-sm text-muted-foreground">New sales and order updates</p>
                      </div>
                      <Switch
                        id="sales-notifications"
                        checked={notifications.sales}
                        onCheckedChange={(checked) => handleNotificationChange("sales", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="stock-notifications">Low Stock Alerts</Label>
                        <p className="text-sm text-muted-foreground">When inventory runs low</p>
                      </div>
                      <Switch
                        id="stock-notifications"
                        checked={notifications.lowStock}
                        onCheckedChange={(checked) => handleNotificationChange("lowStock", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="price-notifications">Price Changes</Label>
                        <p className="text-sm text-muted-foreground">Market price recommendations</p>
                      </div>
                      <Switch
                        id="price-notifications"
                        checked={notifications.priceChanges}
                        onCheckedChange={(checked) => handleNotificationChange("priceChanges", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Marketing</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing-notifications">Product Updates</Label>
                        <p className="text-sm text-muted-foreground">New features and tips</p>
                      </div>
                      <Switch
                        id="marketing-notifications"
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => handleNotificationChange("marketing", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Connections */}
          <TabsContent value="platforms" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Platform Connections
                </CardTitle>
                <CardDescription>
                  Manage your connected selling platforms and their settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(platforms).map(([platform, data]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getPlatformIcon(platform)}</div>
                      <div>
                        <h4 className="font-medium capitalize">{platform}</h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={data.connected ? "default" : "secondary"}
                            className={cn(
                              data.status === "active" && "bg-green-500/20 text-green-300",
                              data.status === "limited" && "bg-yellow-500/20 text-yellow-300",
                              data.status === "disconnected" && "bg-red-500/20 text-red-300"
                            )}
                          >
                            {data.status}
                          </Badge>
                          {data.connected && (
                            <span className="text-sm text-muted-foreground">
                              {data.sales} sales this month
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.connected ? (
                        <>
                          <Button variant="outline" size="sm">
                            Settings
                          </Button>
                          <Button variant="destructive" size="sm">
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm">
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Add New Platform</CardTitle>
                <CardDescription>
                  Connect additional selling platforms to expand your reach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Globe className="mr-2 h-4 w-4" />
                  Browse Available Platforms
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Professional Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Unlimited listings, AI features, priority support
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">$29/month</div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Payment Method</h4>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-12 rounded bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          VISA
                        </div>
                        <div>
                          <div className="font-medium">•••• •••• •••• 4242</div>
                          <div className="text-sm text-muted-foreground">Expires 12/25</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Billing History</h4>
                  <div className="space-y-2">
                    {[
                      { date: "Dec 1, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Nov 1, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Oct 1, 2024", amount: "$29.00", status: "Paid" },
                    ].map((invoice, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div>
                          <div className="font-medium">{invoice.date}</div>
                          <div className="text-sm text-muted-foreground">Professional Plan</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{invoice.amount}</div>
                          <Badge variant="default" className="bg-green-500/20 text-green-300">
                            {invoice.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Protect your account with strong security measures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Password</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          className="glass-input pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="glass-input"
                      />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Authenticator App</div>
                        <div className="text-sm text-muted-foreground">
                          Use an app like Google Authenticator
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Not Enabled</Badge>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">API Access</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          value="sk_live_************************"
                          readOnly
                          className="glass-input pr-20"
                        />
                        <div className="absolute right-0 top-0 flex h-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-full px-3 hover:bg-transparent"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-full px-3 hover:bg-transparent"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use this key to access the NetPost API
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Regenerate Key
                      </Button>
                      <Button variant="outline" size="sm">
                        View Documentation
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Account Actions</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Export Account Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}