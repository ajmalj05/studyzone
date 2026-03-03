import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Calendar, Building2, Users, Shield, History } from "lucide-react";

interface SchoolProfileDto {
  id: string;
  name: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

interface UserDto {
  id: string;
  userId: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface RoleDto {
  id: string;
  name: string;
  description?: string;
  permissionKeys: string[];
}

interface AuditLogEntryDto {
  id: string;
  userId?: string;
  userName?: string;
  tableName: string;
  action: string;
  entityId?: string;
  timestamp: string;
  details?: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileDto | null>(null);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntryDto[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // School form
  const [schoolForm, setSchoolForm] = useState({ name: "", address: "", logoUrl: "", phone: "", email: "" });
  // User form
  const [userForm, setUserForm] = useState({ userId: "", password: "", name: "", role: "teacher" });
  const [showUserForm, setShowUserForm] = useState(false);

  const loadSchoolProfile = async () => {
    try {
      const profile = await fetchApi("/SchoolProfile") as SchoolProfileDto | null;
      if (profile) {
        setSchoolProfile(profile);
        setSchoolForm({
          name: profile.name,
          address: profile.address ?? "",
          logoUrl: profile.logoUrl ?? "",
          phone: profile.phone ?? "",
          email: profile.email ?? "",
        });
      }
    } catch {
      // 404 is ok when no school yet
    }
  };

  const loadUsers = async () => {
    try {
      const list = await fetchApi("/Users") as UserDto[];
      setUsers(list.map((u: Record<string, unknown>) => ({
        id: u.id as string,
        userId: u.userId as string,
        name: u.name as string,
        role: u.role as string,
        isActive: u.isActive as boolean,
        createdAt: (u.createdAt as string).split("T")[0],
      })));
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load users", variant: "destructive" });
    }
  };

  const loadRoles = async () => {
    try {
      const list = await fetchApi("/Roles") as RoleDto[];
      setRoles(list.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        description: r.description as string | undefined,
        permissionKeys: (r.permissionKeys as string[]) ?? [],
      })));
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load roles", variant: "destructive" });
    }
  };

  const loadAuditLog = async () => {
    try {
      const res = await fetchApi("/AuditLog?take=50") as { items: AuditLogEntryDto[]; total: number };
      setAuditLogs((res.items ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        userId: e.userId as string | undefined,
        userName: e.userName as string | undefined,
        tableName: e.tableName as string,
        action: e.action as string,
        entityId: e.entityId as string | undefined,
        timestamp: (e.timestamp as string).replace("T", " ").slice(0, 19),
        details: e.details as string | undefined,
      })));
      setAuditTotal(res.total ?? 0);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load audit log", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadSchoolProfile(), loadUsers(), loadRoles(), loadAuditLog()]);
      setLoading(false);
    })();
  }, []);

  const handleSaveSchoolProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) {
      toast({ title: "Validation", description: "School name is required.", variant: "destructive" });
      return;
    }
    try {
      const updated = await fetchApi("/SchoolProfile", {
        method: "PUT",
        body: JSON.stringify({
          name: schoolForm.name,
          address: schoolForm.address || undefined,
          logoUrl: schoolForm.logoUrl || undefined,
          phone: schoolForm.phone || undefined,
          email: schoolForm.email || undefined,
        }),
      }) as SchoolProfileDto;
      setSchoolProfile(updated);
      toast({ title: "Success", description: "School profile saved." });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to save", variant: "destructive" });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.userId || !userForm.password || !userForm.name || !userForm.role) {
      toast({ title: "Validation", description: "User ID, password, name and role are required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Users", {
        method: "POST",
        body: JSON.stringify({
          userId: userForm.userId,
          password: userForm.password,
          name: userForm.name,
          role: userForm.role,
        }),
      });
      toast({ title: "Success", description: "User created." });
      setUserForm({ userId: "", password: "", name: "", role: "teacher" });
      setShowUserForm(false);
      await loadUsers();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to create user", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Settings" />
        <div className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Academic Year</p>
                  <p className="text-sm text-muted-foreground">Add and set the current academic year (e.g. 2024-2025).</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/admin/academic-year")}>
                Manage academic years
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="school" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="school" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> School
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Users
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Roles
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <History className="h-4 w-4" /> Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="school" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>School Profile</CardTitle>
                  <CardDescription>Name, address, logo and contact used on all printed outputs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSchoolProfile} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={schoolForm.name} onChange={(e) => setSchoolForm((f) => ({ ...f, name: e.target.value }))} placeholder="School name" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={schoolForm.address} onChange={(e) => setSchoolForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input value={schoolForm.logoUrl} onChange={(e) => setSchoolForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={schoolForm.phone} onChange={(e) => setSchoolForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={schoolForm.email} onChange={(e) => setSchoolForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
                    </div>
                    <Button type="submit">Save</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Create and manage user accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => setShowUserForm(true)}>Add user</Button>
                  <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add user</DialogTitle>
                        <DialogDescription>Create a new user account.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-3">
                        <div className="space-y-1">
                          <Label>User ID</Label>
                          <Input value={userForm.userId} onChange={(e) => setUserForm((f) => ({ ...f, userId: e.target.value }))} placeholder="Login ID" required />
                        </div>
                        <div className="space-y-1">
                          <Label>Password</Label>
                          <Input type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} placeholder="Password" required />
                        </div>
                        <div className="space-y-1">
                          <Label>Name</Label>
                          <Input value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
                        </div>
                        <div className="space-y-1">
                          <Label>Role</Label>
                          <Select value={userForm.role} onValueChange={(v) => setUserForm((f) => ({ ...f, role: v }))}>
                            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="accountant">Accountant</SelectItem>
                              <SelectItem value="receptionist">Receptionist</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>Cancel</Button>
                          <Button type="submit">Create</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.userId}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.role}</TableCell>
                          <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                          <TableCell>{u.createdAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>System roles and permissions (view only).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.description ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.permissionKeys?.length ?? 0} permissions</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>Recent data changes (who, when, table, action). Total: {auditTotal}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs">{e.timestamp}</TableCell>
                          <TableCell>{e.userName ?? e.userId ?? "—"}</TableCell>
                          <TableCell>{e.tableName}</TableCell>
                          <TableCell>{e.action}</TableCell>
                          <TableCell className="text-xs">{e.entityId ?? "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{e.details ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}
