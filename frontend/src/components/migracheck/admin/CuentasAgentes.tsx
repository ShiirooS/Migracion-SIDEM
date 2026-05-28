import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Trash2, Pencil } from "lucide-react";

type Agent = { id: string; nombre: string; sede: string; rol: string; estado: "Activo" | "Suspendido" };

const SEED: Agent[] = [
  { id: "SNM-A-0421", nombre: "Cap. Luis A. Caballero", sede: "Tocumen", rol: "Inspector senior", estado: "Activo" },
  { id: "SNM-A-0418", nombre: "Tte. Marisol Tejada", sede: "Paso Canoas", rol: "Inspector", estado: "Activo" },
  { id: "SNM-A-0405", nombre: "Sgto. Iván Mendoza", sede: "Colón", rol: "Inspector", estado: "Suspendido" },
  { id: "SNM-A-0392", nombre: "Insp. Carolina Gil", sede: "David", rol: "Auditor", estado: "Activo" },
];

export function CuentasAgentes() {
  const [agents, setAgents] = useState<Agent[]>(SEED);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", nombre: "", sede: "", rol: "" });

  const add = () => {
    if (!form.id || !form.nombre) return;
    setAgents((a) => [{ ...form, estado: "Activo" } as Agent, ...a]);
    setForm({ id: "", nombre: "", sede: "", rol: "" });
    setOpen(false);
  };

  const remove = (id: string) => setAgents((a) => a.filter((x) => x.id !== id));

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-serif text-lg">Cuentas de Agentes</CardTitle>
          <p className="text-sm text-muted-foreground">Alta y baja de inspectores migratorios.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-institutional text-gold hover:bg-institutional-hover">
              <UserPlus className="mr-2 h-4 w-4" /> Nuevo agente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dar de alta un agente</DialogTitle>
              <DialogDescription>Complete los datos institucionales del inspector.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label>ID Agente</Label>
                <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="SNM-A-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Nombre completo</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sede</Label>
                <Input value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Input value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={add} className="bg-institutional text-gold hover:bg-institutional-hover">
                Crear agente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="pl-6">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="pr-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="pl-6 font-mono text-sm font-medium text-institutional">{a.id}</TableCell>
                <TableCell>{a.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{a.sede}</TableCell>
                <TableCell>{a.rol}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      a.estado === "Activo"
                        ? "border-success bg-success/10 text-success"
                        : "border-danger bg-danger/10 text-danger"
                    }
                  >
                    {a.estado}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => remove(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
