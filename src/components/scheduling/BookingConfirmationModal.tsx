import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addMinutes, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User, Phone, Loader2 } from 'lucide-react';

interface BookingConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  serviceLocationType?: 'store' | 'customer' | 'both';
  selectedDate: Date | null;
  selectedTime: string | null;
  slotDuration?: number;
  onSuccess?: () => void;
}

export function BookingConfirmationModal({
  open,
  onOpenChange,
  establishmentId,
  productId,
  productName,
  productPrice,
  serviceLocationType = 'store',
  selectedDate,
  selectedTime,
  slotDuration = 60,
  onSuccess,
}: BookingConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_location: serviceLocationType === 'both' ? 'store' : serviceLocationType,
    customer_address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário');
      return;
    }

    if (!formData.customer_name || !formData.customer_phone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    if (formData.service_location === 'customer' && !formData.customer_address) {
      toast.error('Informe o endereço para atendimento');
      return;
    }

    setLoading(true);
    try {
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');
      const startTime = parse(selectedTime, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, slotDuration);
      const endTimeStr = format(endTime, 'HH:mm');

      const { error } = await supabase.from('service_bookings').insert({
        establishment_id: establishmentId,
        product_id: productId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        booking_date: bookingDate,
        booking_time: selectedTime,
        end_time: endTimeStr,
        service_location: formData.service_location,
        customer_address: formData.customer_address || null,
        notes: formData.notes || null,
        price: productPrice,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Agendamento realizado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        service_location: serviceLocationType === 'both' ? 'store' : serviceLocationType,
        customer_address: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Erro ao realizar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Agendamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Booking Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            {productName && (
              <p className="font-medium">{productName}</p>
            )}
            {selectedDate && selectedTime && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedTime}
                </span>
              </div>
            )}
            {productPrice !== undefined && (
              <p className="text-sm">
                Valor: <strong>R$ {productPrice.toFixed(2)}</strong>
              </p>
            )}
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="customer_name">Nome *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer_name"
                  placeholder="Seu nome completo"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_phone">Telefone/WhatsApp *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer_phone"
                  placeholder="(00) 00000-0000"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_email">E-mail (opcional)</Label>
              <Input
                id="customer_email"
                type="email"
                placeholder="seu@email.com"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              />
            </div>
          </div>

          {/* Service Location */}
          {serviceLocationType === 'both' && (
            <div className="space-y-2">
              <Label>Local do atendimento</Label>
              <RadioGroup
                value={formData.service_location}
                onValueChange={(value) => setFormData(prev => ({ ...prev, service_location: value as 'store' | 'customer' }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="store" id="store" />
                  <Label htmlFor="store" className="font-normal">
                    Vou até o estabelecimento
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="font-normal">
                    Atendimento no meu endereço
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {(formData.service_location === 'customer' || serviceLocationType === 'customer') && (
            <div>
              <Label htmlFor="customer_address">Endereço para atendimento *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="customer_address"
                  placeholder="Rua, número, bairro, cidade..."
                  value={formData.customer_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                  className="pl-10 min-h-[80px]"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Alguma informação adicional..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
