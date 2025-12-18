import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  MoreVertical,
  Check,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  end_time: string;
  service_location: string;
  customer_address?: string;
  status: string;
  notes?: string;
  price?: number;
  product?: {
    name: string;
  };
  created_at: string;
}

interface BookingsManagementProps {
  establishmentId: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  no_show: { label: 'Não compareceu', variant: 'destructive' },
};

export function BookingsManagement({ establishmentId }: BookingsManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'past' | 'all'>('today');

  useEffect(() => {
    loadBookings();
  }, [establishmentId, filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('service_bookings')
        .select(`
          *,
          product:products(name)
        `)
        .eq('establishment_id', establishmentId)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      const today = format(new Date(), 'yyyy-MM-dd');

      if (filter === 'today') {
        query = query.eq('booking_date', today);
      } else if (filter === 'upcoming') {
        query = query.gte('booking_date', today).in('status', ['pending', 'confirmed']);
      } else if (filter === 'past') {
        query = query.lt('booking_date', today);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Status atualizado!');
      loadBookings();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const formatLocation = (location: string) => {
    switch (location) {
      case 'store': return 'No estabelecimento';
      case 'customer': return 'No endereço do cliente';
      default: return location;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadBookings}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Passados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {booking.customer_name}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.customer_phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{booking.product?.name || '-'}</span>
                          {booking.price && (
                            <Badge variant="outline" className="ml-2">
                              R$ {booking.price.toFixed(2)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(booking.booking_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {booking.booking_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {formatLocation(booking.service_location)}
                            </span>
                            {booking.customer_address && (
                              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {booking.customer_address}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[booking.status]?.variant || 'secondary'}>
                            {STATUS_CONFIG[booking.status]?.label || booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {booking.status === 'pending' && (
                                <DropdownMenuItem onClick={() => updateStatus(booking.id, 'confirmed')}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => updateStatus(booking.id, 'completed')}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Marcar como concluído
                                </DropdownMenuItem>
                              )}
                              {['pending', 'confirmed'].includes(booking.status) && (
                                <DropdownMenuItem 
                                  onClick={() => updateStatus(booking.id, 'cancelled')}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => updateStatus(booking.id, 'no_show')}>
                                  <X className="mr-2 h-4 w-4" />
                                  Não compareceu
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
