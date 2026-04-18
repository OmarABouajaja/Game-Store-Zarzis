import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DebugAuth = () => {
  const { user, role, isOwner, isStaff, isLoading } = useAuth();


  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-red-50 border-red-200 shadow-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-red-700">🔍 Auth Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>User:</span>
          <span className="font-mono truncate">{user?.email || 'null'}</span>
        </div>
        <div className="flex justify-between">
          <span>Role:</span>
          <Badge variant={role === 'owner' ? 'default' : 'secondary'}>{role || 'null'}</Badge>
        </div>
        <div className="flex justify-between">
          <span>isOwner:</span>
          <Badge variant={isOwner ? 'default' : 'destructive'}>{isOwner ? 'true' : 'false'}</Badge>
        </div>
        <div className="flex justify-between">
          <span>isStaff:</span>
          <Badge variant={isStaff ? 'default' : 'secondary'}>{isStaff ? 'true' : 'false'}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Loading:</span>
          <Badge variant={isLoading ? 'secondary' : 'default'}>{isLoading ? 'true' : 'false'}</Badge>
        </div>
        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-medium mb-1">Navigation:</p>
          <p className="text-xs text-muted-foreground">
            Should show: {isOwner ? 'OWNER menu' : 'WORKER menu'}
          </p>
          <p className="text-xs text-green-600 font-medium">
            ✓ Fixed: Now using dynamic role-based navigation
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugAuth;
