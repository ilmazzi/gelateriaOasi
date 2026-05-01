import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/api/apiClient.js";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, authChecked, isLoadingAuth, checkUserAuth } = useAuth();

  const redirectTarget = useMemo(() => searchParams.get("redirect") || `${window.location.origin}/admin`, [searchParams]);

  useEffect(() => {
    if (!isLoadingAuth && authChecked && isAuthenticated && isAdmin) {
      const nextPath = redirectTarget.startsWith(window.location.origin)
        ? redirectTarget.replace(window.location.origin, "")
        : "/admin";
      navigate(nextPath || "/admin", { replace: true });
    }
  }, [authChecked, isAdmin, isAuthenticated, isLoadingAuth, navigate, redirectTarget]);

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      await apiClient.auth.login({ email, password });
      await checkUserAuth();
    } catch (error) {
      toast({
        title: "Login non riuscito",
        description: error.message || "Controlla email e password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Login Admin</CardTitle>
        </CardHeader>
        <CardContent>
          {authChecked && isAuthenticated && !isAdmin ? (
            <p className="text-sm text-destructive">Sei autenticato ma non hai ruolo admin. Contatta il proprietario.</p>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@esempio.it"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Inserisci la password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Accesso in corso..." : "Accedi"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Reset password non ancora disponibile con backend JWT. Se serve, imposta un nuovo hash direttamente nel DB.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                <Link to="/" className="underline">
                  Torna alla home
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
