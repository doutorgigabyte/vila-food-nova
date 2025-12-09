import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Send, 
  MessageSquare, 
  Plus, 
  Search,
  Phone,
  Store,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
  FileText,
  Trash2,
  Edit,
  Eye,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SystemContact {
  id: string;
  establishment_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  is_active: boolean;
  tags: string[];
  notes: string | null;
  opted_in_broadcasts: boolean;
  last_message_at: string | null;
  created_at: string;
  establishment?: {
    name: string;
    slug: string;
  };
}

interface BroadcastCampaign {
  id: string;
  name: string;
  message: string;
  media_url: string | null;
  media_type: string | null;
  target_tags: string[];
  target_all: boolean;
  status: string;
  scheduled_for: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  message: string;
  variables: string[];
  is_active: boolean;
}

const SystemBroadcastCRM = () => {
  const [contacts, setContacts] = useState<SystemContact[]>([]);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Campaign dialog state
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message: '',
    media_url: '',
    target_all: true,
    target_tags: [] as string[],
    scheduled_for: ''
  });

  // Contact dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SystemContact | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'other',
    tags: '',
    notes: '',
    opted_in_broadcasts: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch contacts with establishment info
      const { data: contactsData } = await supabase
        .from('system_contacts')
        .select(`
          *,
          establishment:establishments(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (contactsData) {
        setContacts(contactsData as SystemContact[]);
        
        // Extract unique tags
        const tags = new Set<string>();
        contactsData.forEach(c => {
          (c.tags || []).forEach((t: string) => tags.add(t));
        });
        setAllTags(Array.from(tags));
      }

      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsData) setCampaigns(campaignsData);

      // Fetch templates
      const { data: templatesData } = await supabase
        .from('system_message_templates')
        .select('*')
        .order('category', { ascending: true });

      if (templatesData) setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    try {
      const contactData = {
        name: contactForm.name,
        phone: contactForm.phone,
        email: contactForm.email || null,
        role: contactForm.role,
        tags: contactForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: contactForm.notes || null,
        opted_in_broadcasts: contactForm.opted_in_broadcasts
      };

      if (editingContact) {
        await supabase
          .from('system_contacts')
          .update(contactData)
          .eq('id', editingContact.id);
        toast.success('Contato atualizado!');
      } else {
        await supabase
          .from('system_contacts')
          .insert(contactData);
        toast.success('Contato adicionado!');
      }

      setContactDialogOpen(false);
      resetContactForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar contato');
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Excluir este contato?')) return;

    try {
      await supabase.from('system_contacts').delete().eq('id', id);
      toast.success('Contato excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const createCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message) {
      toast.error('Nome e mensagem são obrigatórios');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('broadcast_campaigns').insert({
        name: campaignForm.name,
        message: campaignForm.message,
        media_url: campaignForm.media_url || null,
        target_all: campaignForm.target_all,
        target_tags: campaignForm.target_tags,
        scheduled_for: campaignForm.scheduled_for || null,
        status: campaignForm.scheduled_for ? 'scheduled' : 'draft',
        created_by: user?.id
      });

      toast.success('Campanha criada!');
      setCampaignDialogOpen(false);
      resetCampaignForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar campanha');
    }
  };

  const sendCampaign = async (campaignId: string) => {
    if (!confirm('Enviar campanha agora? Esta ação não pode ser desfeita.')) return;

    try {
      // Update campaign status
      await supabase
        .from('broadcast_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId);

      // Trigger Edge Function to send messages
      const { error } = await supabase.functions.invoke('system-broadcast', {
        body: { campaign_id: campaignId }
      });

      if (error) throw error;

      toast.success('Campanha iniciada!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao enviar campanha');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Excluir esta campanha?')) return;

    try {
      await supabase.from('broadcast_campaigns').delete().eq('id', id);
      toast.success('Campanha excluída!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const resetContactForm = () => {
    setContactForm({
      name: '',
      phone: '',
      email: '',
      role: 'other',
      tags: '',
      notes: '',
      opted_in_broadcasts: true
    });
    setEditingContact(null);
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      message: '',
      media_url: '',
      target_all: true,
      target_tags: [],
      scheduled_for: ''
    });
  };

  const openEditContact = (contact: SystemContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      role: contact.role,
      tags: (contact.tags || []).join(', '),
      notes: contact.notes || '',
      opted_in_broadcasts: contact.opted_in_broadcasts
    });
    setContactDialogOpen(true);
  };

  const useTemplate = (template: MessageTemplate) => {
    setCampaignForm(prev => ({
      ...prev,
      message: template.message
    }));
    toast.success(`Template "${template.name}" aplicado`);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.establishment?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === 'all' || 
      (contact.tags || []).includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const activeContacts = contacts.filter(c => c.is_active && c.opted_in_broadcasts);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendada</Badge>;
      case 'sending':
        return <Badge className="bg-blue-500">Enviando...</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluída</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Central de Comunicação">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Central de Comunicação</h1>
          <p className="text-muted-foreground">
            Gerencie contatos e envie mensagens em massa para lojistas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Contatos</p>
                  <p className="text-xl font-bold">{contacts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opt-in Ativos</p>
                  <p className="text-xl font-bold">{activeContacts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Megaphone className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campanhas</p>
                  <p className="text-xl font-bold">{campaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Templates</p>
                  <p className="text-xl font-bold">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contatos do Sistema</CardTitle>
                  <CardDescription>
                    Contatos são cadastrados automaticamente quando uma loja é criada
                  </CardDescription>
                </div>
                <Dialog open={contactDialogOpen} onOpenChange={(open) => { 
                  setContactDialogOpen(open); 
                  if (!open) resetContactForm(); 
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Contato
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingContact ? 'Editar Contato' : 'Novo Contato'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Nome do contato"
                        />
                      </div>
                      <div>
                        <Label>WhatsApp *</Label>
                        <Input
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="5511999999999"
                        />
                      </div>
                      <div>
                        <Label>E-mail</Label>
                        <Input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <Select 
                          value={contactForm.role} 
                          onValueChange={(v) => setContactForm({ ...contactForm, role: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Proprietário</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="attendant">Atendente</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tags (separadas por vírgula)</Label>
                        <Input
                          value={contactForm.tags}
                          onChange={(e) => setContactForm({ ...contactForm, tags: e.target.value })}
                          placeholder="lojista, novo, vip"
                        />
                      </div>
                      <div>
                        <Label>Observações</Label>
                        <Textarea
                          value={contactForm.notes}
                          onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Aceita receber mensagens</Label>
                        <Switch
                          checked={contactForm.opted_in_broadcasts}
                          onCheckedChange={(checked) => setContactForm({ ...contactForm, opted_in_broadcasts: checked })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveContact}>
                        {editingContact ? 'Salvar' : 'Adicionar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, telefone ou loja..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as tags</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum contato encontrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contato</TableHead>
                        <TableHead>Loja</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Opt-in</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map(contact => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.establishment ? (
                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-muted-foreground" />
                                <span>{contact.establishment.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(contact.tags || []).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.opted_in_broadcasts ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openEditContact(contact)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteContact(contact.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Campanhas de Disparo</CardTitle>
                  <CardDescription>
                    Crie e gerencie campanhas de mensagens em massa
                  </CardDescription>
                </div>
                <Dialog open={campaignDialogOpen} onOpenChange={(open) => {
                  setCampaignDialogOpen(open);
                  if (!open) resetCampaignForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Campanha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Campanha</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Nome da Campanha *</Label>
                          <Input
                            value={campaignForm.name}
                            onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                            placeholder="Ex: Atualização de Sistema"
                          />
                        </div>
                        <div>
                          <Label>Mensagem *</Label>
                          <Textarea
                            value={campaignForm.message}
                            onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                            placeholder="Digite sua mensagem..."
                            rows={8}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use *texto* para negrito e _texto_ para itálico
                          </p>
                        </div>
                        <div>
                          <Label>URL de Mídia (opcional)</Label>
                          <Input
                            value={campaignForm.media_url}
                            onChange={(e) => setCampaignForm({ ...campaignForm, media_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label>Agendar para (opcional)</Label>
                          <Input
                            type="datetime-local"
                            value={campaignForm.scheduled_for}
                            onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_for: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">Destinatários</Label>
                          <div className="flex items-center gap-2 mb-3">
                            <Checkbox 
                              checked={campaignForm.target_all}
                              onCheckedChange={(checked) => setCampaignForm({ 
                                ...campaignForm, 
                                target_all: !!checked,
                                target_tags: checked ? [] : campaignForm.target_tags
                              })}
                            />
                            <span>Enviar para todos ({activeContacts.length} contatos)</span>
                          </div>
                          {!campaignForm.target_all && (
                            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                              {allTags.map(tag => (
                                <div key={tag} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={campaignForm.target_tags.includes(tag)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setCampaignForm({
                                          ...campaignForm,
                                          target_tags: [...campaignForm.target_tags, tag]
                                        });
                                      } else {
                                        setCampaignForm({
                                          ...campaignForm,
                                          target_tags: campaignForm.target_tags.filter(t => t !== tag)
                                        });
                                      }
                                    }}
                                  />
                                  <Badge variant="outline">{tag}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="mb-2 block">Templates Rápidos</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {templates.filter(t => t.is_active).slice(0, 4).map(template => (
                              <Button
                                key={template.id}
                                variant="outline"
                                size="sm"
                                className="text-xs justify-start"
                                onClick={() => useTemplate(template)}
                              >
                                {template.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={createCampaign}>
                        {campaignForm.scheduled_for ? 'Agendar' : 'Criar Rascunho'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhuma campanha criada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Destinatários</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviados</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map(campaign => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {campaign.message.substring(0, 50)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {campaign.target_all ? (
                              <Badge>Todos</Badge>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {campaign.target_tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-green-600">{campaign.sent_count}</span>
                              {campaign.failed_count > 0 && (
                                <span className="text-red-500 ml-1">/ {campaign.failed_count} falhas</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {campaign.scheduled_for ? (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(campaign.scheduled_for).toLocaleDateString('pt-BR')}
                              </div>
                            ) : (
                              new Date(campaign.created_at).toLocaleDateString('pt-BR')
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {campaign.status === 'draft' && (
                                <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                                  <Send className="w-4 h-4 mr-1" />
                                  Enviar
                                </Button>
                              )}
                              {campaign.status !== 'sending' && (
                                <Button size="sm" variant="ghost" onClick={() => deleteCampaign(campaign.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Mensagem</CardTitle>
                <CardDescription>
                  Templates pré-definidos para mensagens do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <Card key={template.id} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {template.message}
                        </pre>
                        {template.variables.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Variáveis:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map(v => (
                                <Badge key={v} variant="secondary" className="text-xs">
                                  {`{{${v}}}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SystemBroadcastCRM;
