import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { assertSupabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
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

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      const supabase = assertSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
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

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: "Inserisci email",
        description: "Per inviare il link magico devi prima inserire l'email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingMagicLink(true);
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
        title: "Invio link non riuscito",
        description: error.message || "Verifica configurazione Supabase e riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Inserisci email",
        description: "Per resettare la password devi prima inserire l'email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingMagicLink(true);
      const supabase = assertSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;

      toast({
        title: "Controlla la tua email",
        description: "Ti abbiamo inviato il link per reimpostare la password.",
      });
    } catch (error) {
      toast({
        title: "Reset non riuscito",
        description: error.message || "Verifica configurazione Supabase e riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMagicLink(false);
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
              <button
                type="button"
                onClick={handlePasswordReset}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                disabled={isSendingMagicLink}
              >
                Password dimenticata?
              </button>
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={handleMagicLink}
                disabled={isSendingMagicLink}
              >
                {isSendingMagicLink ? "Invio link..." : "Usa link magico"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Hai ricevuto un link di recupero? Aprilo e completa il reset in{" "}
                <Link to="/admin/reset-password" className="underline">
                  questa pagina
                </Link>.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
