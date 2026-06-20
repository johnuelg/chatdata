import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFirstPermittedPath } from "@/hooks/useNavPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

/**
 * Smart landing page that redirects users to their first permitted admin page.
 * Admins go to /admin (dashboard). Non-admins go to their first allowed page.
 */
const AdminLanding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { path, loading } = useFirstPermittedPath();

  useEffect(() => {
    if (authLoading || loading) return;
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (path) {
      navigate(path, { replace: true });
    }
  }, [user, path, authLoading, loading, navigate]);

  const showNoAccess = !authLoading && !loading && !!user && !path;

  if (showNoAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-xl font-heading font-bold text-foreground">Access Not Assigned</h1>
          <p className="text-muted-foreground">
            Your account is signed in, but no dashboard menu is assigned to your role yet.
          </p>
          <Button onClick={async () => {
            await signOut();
            navigate("/admin/login", { replace: true });
          }}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default AdminLanding;
