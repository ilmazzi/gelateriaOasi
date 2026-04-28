import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { assertSupabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, authChecked, isLoadingAuth } = useAuth();

  const redirectTarget = useMemo(
    () => searchParams.get("redirect") || `${window.location.origin}/admin`,
    [searchParams],
  );

  useEffect(() => {
    if (!isLoadingAuth && authChecked && isAuthenticated && isAdmin) {
      const nextPath = redirectTarget.startsWith(window.location.origin)
        ? redirectTarget.replace(window.location.origin, "")
        : "/admin";
      navigate(nextPath || "/admin", { replace: true });
    }
  }, [authChecked, isAdmin, isAuthenticated, isLoadingAuth, navigate, redirectTarget]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;

    try {
      setSending(true);
      const supabase = assertSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTarget,
        },
      });
      if (error) throw error;

      toast({
        title: "Controlla la tua email",
        description: "Ti abbiamo inviato un link magico per accedere all'area admin.",
      });
    } catch (error) {
      toast({
        title: "Login non riuscito",
        description: error.message || "Verifica configurazione Supabase e riprova.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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
            <p className="text-sm text-destructive">
              Sei autenticato ma non hai ruolo admin. Contatta il proprietario per assegnare `profiles.role = admin`.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button className="w-full" type="submit" disabled={sending}>
                {sending ? "Invio link..." : "Invia link magico"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
