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
import { formatEur } from "@/lib/format";

interface MaterialData {
  id: number;
  name: string;
  active: boolean;
  unitPrice: number;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Record<number, string>>({});

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
    const unitPrice = parseFloat(newPrice) || 0;
    await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), unitPrice }),
    });
    setNewName("");
    setNewPrice("");
    setAdding(false);
    fetchMaterials();
  };

  const updatePrice = async (id: number) => {
    const raw = editingPrices[id];
    if (raw === undefined) return;
    const unitPrice = parseFloat(raw.replace(",", "."));
    if (isNaN(unitPrice)) {
      setEditingPrices((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    await fetch("/api/materials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, unitPrice }),
    });
    setEditingPrices((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
            <Input
              placeholder="Stückpreis (€)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
              className="max-w-[150px]"
              type="number"
              step="0.01"
              min="0"
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
                <TableHead className="text-right">Stückpreis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell className="font-mono">{mat.id}</TableCell>
                  <TableCell>{mat.name}</TableCell>
                  <TableCell className="text-right">
                    {editingPrices[mat.id] !== undefined ? (
                      <Input
                        className="w-28 ml-auto text-right"
                        autoFocus
                        value={editingPrices[mat.id]}
                        onChange={(e) =>
                          setEditingPrices((prev) => ({
                            ...prev,
                            [mat.id]: e.target.value,
                          }))
                        }
                        onBlur={() => updatePrice(mat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updatePrice(mat.id);
                          if (e.key === "Escape")
                            setEditingPrices((prev) => {
                              const next = { ...prev };
                              delete next[mat.id];
                              return next;
                            });
                        }}
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    ) : (
                      <button
                        className="font-mono hover:underline cursor-pointer"
                        onClick={() =>
                          setEditingPrices((prev) => ({
                            ...prev,
                            [mat.id]: String(mat.unitPrice),
                          }))
                        }
                      >
                        {formatEur(mat.unitPrice)}
                      </button>
                    )}
                  </TableCell>
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
