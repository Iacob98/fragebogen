import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Erfolgreich gesendet!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ihre Materialverbrauchsmeldung wurde erfolgreich übermittelt.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/form">Neue Meldung erstellen</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
