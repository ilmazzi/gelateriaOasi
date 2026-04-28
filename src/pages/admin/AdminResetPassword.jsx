import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { assertSupabase } from "@/lib/supabase-client";

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password || password.length < 8) {
      toast({
        title: "Password troppo corta",
        description: "Usa almeno 8 caratteri.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Le password non coincidono",
        description: "Controlla i campi e riprova.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const supabase = assertSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Password aggiornata",
        description: "Ora puoi accedere con la nuova password.",
      });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      toast({
        title: "Reset non riuscito",
        description: error.message || "Apri nuovamente il link di recupero e riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Reimposta Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimo 8 caratteri"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Ripeti la password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva nuova password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
