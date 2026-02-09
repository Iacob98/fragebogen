"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";

interface MaterialData {
  id: number;
  name: string;
  active: boolean;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchMaterials = useCallback(async () => {
    const res = await fetch("/api/materials?all=true");
    const data = await res.json();
    setMaterials(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const toggleActive = async (id: number, active: boolean) => {
    await fetch("/api/materials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchMaterials();
  };

  const addMaterial = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setAdding(false);
    fetchMaterials();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Materialien</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Neues Material hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Material Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
              className="max-w-sm"
            />
            <Button onClick={addMaterial} disabled={adding || !newName.trim()}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell className="font-mono">{mat.id}</TableCell>
                  <TableCell>{mat.name}</TableCell>
                  <TableCell>
                    <Badge variant={mat.active ? "default" : "secondary"}>
                      {mat.active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(mat.id, mat.active)}
                    >
                      {mat.active ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
