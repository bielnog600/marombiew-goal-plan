import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo_marombiew.png";

type Lead = {
  id: string;
  nome: string;
  whatsapp: string;
  sexo: string;
  idade: number;
  peso: number;
  altura: number;
  nivel_atividade: string;
  objetivo: string;
  tmb: number | null;
  tdee: number | null;
  calorias_ajustadas: number | null;
  proteina_g: number | null;
  carboidrato_g: number | null;
  gordura_g: number | null;
  created_at: string;
};

const ATIVIDADE_LABELS: Record<string, string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  muito: "Muito ativo",
  extremo: "Extremo",
};

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchLeads();
    }
  }, [session]);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("calculator_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data as Lead[]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const sendWhatsApp = (lead: Lead, customMessage?: string) => {
    const msg = customMessage || `Olá ${lead.nome.split(" ")[0]}! 👋\n\nVi que você usou a Marombiew Calc e seu objetivo é ${lead.objetivo === "hipertrofia" ? "💪 Hipertrofia" : "🔥 Emagrecimento"}.\n\nSeu plano: ${lead.calorias_ajustadas} kcal/dia\n• Proteína: ${lead.proteina_g}g\n• Carbs: ${lead.carboidrato_g}g\n• Gordura: ${lead.gordura_g}g\n\nQuer montar sua dieta personalizada? 🍽️`;
    const phone = lead.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.whatsapp.includes(search) ||
      l.objetivo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Login screen
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Marombiew" className="h-16 object-contain" />
          </div>
          <Card className="border-primary/30 bg-card">
            <CardHeader>
              <CardTitle className="text-primary text-xl text-center">🔒 Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                    className="bg-input border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-input border-border"
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-destructive text-center">{authError}</p>
                )}
                <Button type="submit" className="w-full font-bold" disabled={authLoading}>
                  {authLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Marombiew" className="h-10 object-contain" />
            <h1 className="text-2xl font-bold text-primary">Painel Admin</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} size="sm">
            Sair
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/30 bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <p className="text-3xl font-bold text-primary">{leads.length}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Hipertrofia</p>
              <p className="text-3xl font-bold text-primary">
                {leads.filter((l) => l.objetivo === "hipertrofia").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Emagrecimento</p>
              <p className="text-3xl font-bold text-primary">
                {leads.filter((l) => l.objetivo === "emagrecimento").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-3xl font-bold text-primary">
                {leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Buscar por nome, WhatsApp ou objetivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-input border-border max-w-md"
          />
        </div>

        {/* Leads Table */}
        <Card className="border-primary/30 bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="hidden md:table-cell">Objetivo</TableHead>
                  <TableHead className="hidden md:table-cell">Calorias</TableHead>
                  <TableHead className="hidden lg:table-cell">Atividade</TableHead>
                  <TableHead className="hidden lg:table-cell">P / C / G</TableHead>
                  <TableHead className="hidden lg:table-cell">Data</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{lead.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.sexo === "masculino" ? "♂" : "♀"} {lead.idade}a · {lead.peso}kg · {lead.altura}cm
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {ATIVIDADE_LABELS[lead.nivel_atividade] || lead.nivel_atividade}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">{lead.whatsapp}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={lead.objetivo === "hipertrofia" ? "default" : "secondary"}
                        className={lead.objetivo === "hipertrofia" ? "bg-primary text-primary-foreground" : ""}
                      >
                        {lead.objetivo === "hipertrofia" ? "💪 Hiper" : "🔥 Emag"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-foreground font-medium">
                      {lead.calorias_ajustadas} kcal
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {lead.proteina_g}g / {lead.carboidrato_g}g / {lead.gordura_g}g
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => sendWhatsApp(lead)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        📲 WhatsApp
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
