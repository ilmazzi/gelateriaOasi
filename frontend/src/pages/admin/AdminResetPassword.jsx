import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function AdminResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            In questa versione con backend JWT il reset password via email non e disponibile.
          </p>
          <p>
            Per cambiare password, genera un nuovo hash bcrypt e aggiorna `public.users.password_hash`.
          </p>
          <p>
            <Link to="/admin/login" className="underline">
              Torna al login admin
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
