import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { formatOrderNumber } from "@/lib/format";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  const displayNumber = orderNumber
    ? formatOrderNumber(parseInt(orderNumber))
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Заказ отправлен!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayNumber && (
            <p className="text-lg font-mono font-semibold">{displayNumber}</p>
          )}
          <p className="text-muted-foreground">
            Ваш заказ на материалы был успешно создан.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/order">Создать новый заказ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
