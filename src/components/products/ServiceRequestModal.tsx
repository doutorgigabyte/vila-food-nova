import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, MapPin, Wrench, Phone, User } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ServiceProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotional_price?: number;
  image_url?: string;
  service_duration?: number;
  service_location?: string;
  requires_booking?: boolean;
  booking_advance_days?: number;
}

interface ServiceRequestModalProps {
  product: ServiceProduct | null;
  establishmentWhatsapp?: string;
  onClose: () => void;
}

export const ServiceRequestModal = ({ product, establishmentWhatsapp, onClose }: ServiceRequestModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [location, setLocation] = useState<'store' | 'customer' | 'remote'>('store');
  const [address, setAddress] = useState("");
  const [observations, setObservations] = useState("");

  if (!product) return null;

  const hasPromo = Boolean(
    product.promotional_price && 
    product.promotional_price > 0 && 
    product.promotional_price < product.price
  );
  const displayPrice = hasPromo ? product.promotional_price! : product.price;

  const minDate = addDays(new Date(), product.booking_advance_days || 1);

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const locationLabels = {
    store: "No estabelecimento",
    customer: "No meu endereço",
    remote: "Atendimento remoto",
  };

  const handleSubmit = () => {
    if (!name || !phone) {
      toast.error("Preencha nome e telefone");
      return;
    }

    if (product.requires_booking && (!selectedDate || !selectedTime)) {
      toast.error("Selecione data e horário para agendamento");
      return;
    }

    if (location === 'customer' && !address) {
      toast.error("Preencha o endereço para atendimento");
      return;
    }

    // Create WhatsApp message
    let message = `*Solicitação de Serviço*\n\n`;
    message += `📋 *Serviço:* ${product.name}\n`;
    message += `💰 *Valor:* R$ ${displayPrice.toFixed(2)}\n`;
    if (product.service_duration) {
      message += `⏱️ *Duração estimada:* ${product.service_duration} min\n`;
    }
    message += `\n👤 *Cliente:* ${name}\n`;
    message += `📱 *Telefone:* ${phone}\n`;
    message += `📍 *Local:* ${locationLabels[location]}\n`;
    if (location === 'customer' && address) {
      message += `🏠 *Endereço:* ${address}\n`;
    }
    if (selectedDate && selectedTime) {
      message += `📅 *Data:* ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}\n`;
      message += `🕐 *Horário:* ${selectedTime}\n`;
    }
    if (observations) {
      message += `\n💬 *Observações:* ${observations}\n`;
    }

    // Open WhatsApp
    const whatsappNumber = establishmentWhatsapp?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast.success("Redirecionando para WhatsApp...");
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Solicitar Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h3 className="font-semibold">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="font-bold text-primary text-lg">
                R$ {displayPrice.toFixed(2)}
              </span>
              {product.service_duration && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {product.service_duration} min
                </Badge>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Seu Nome
              </Label>
              <Input
                placeholder="Como devemos te chamar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp
              </Label>
              <Input
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Location Selection */}
          {product.service_location !== 'remote' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Local de Atendimento
              </Label>
              <Select value={location} onValueChange={(v) => setLocation(v as typeof location)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">No estabelecimento</SelectItem>
                  <SelectItem value="customer">No meu endereço</SelectItem>
                  <SelectItem value="remote">Atendimento remoto</SelectItem>
                </SelectContent>
              </Select>

              {location === 'customer' && (
                <Textarea
                  placeholder="Digite seu endereço completo..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          )}

          {/* Booking Date/Time */}
          {product.requires_booking && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Agendamento
              </Label>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate 
                      ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                      : "Selecione a data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < minDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Alguma informação adicional sobre o serviço..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold"
          >
            Solicitar via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
