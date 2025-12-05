import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Bike,
  Package,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Navigation,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { StoreEstablishment } from "@/hooks/useStoreData";

interface StoreInfoTabProps {
  establishment: StoreEstablishment;
}

export const StoreInfoTab = ({ establishment }: StoreInfoTabProps) => {
  const whatsappLink = establishment.whatsapp
    ? `https://wa.me/${establishment.whatsapp.replace(/\D/g, "")}`
    : null;

  const mapsLink = establishment.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${establishment.address}, ${establishment.neighborhood || ""}`
      )}`
    : null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg mb-4">
          {establishment.logo_url ? (
            <img
              src={establishment.logo_url}
              alt={establishment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
              {establishment.name.charAt(0)}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold">{establishment.name}</h2>
        {establishment.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {establishment.description}
          </p>
        )}
        <Badge
          className={`mt-3 ${
            establishment.is_open
              ? "bg-green-500 hover:bg-green-500"
              : "bg-muted hover:bg-muted"
          }`}
        >
          {establishment.is_open ? "🟢 Aberto" : "🔴 Fechado"}
        </Badge>
      </div>

      <Separator />

      {/* Contact Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Contato
        </h3>

        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors group"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">{establishment.whatsapp}</p>
            </div>
            <span className="text-xs text-green-600 font-medium group-hover:underline">
              Abrir Chat →
            </span>
          </a>
        )}

        {establishment.phone && (
          <a
            href={`tel:${establishment.phone.replace(/\D/g, "")}`}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Telefone</p>
              <p className="text-xs text-muted-foreground">{establishment.phone}</p>
            </div>
          </a>
        )}

        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Endereço</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {establishment.address}
                {establishment.neighborhood && `, ${establishment.neighborhood}`}
              </p>
            </div>
            <Navigation className="w-4 h-4 text-muted-foreground" />
          </a>
        )}
      </div>

      <Separator />

      {/* Delivery Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Informações de Entrega
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{establishment.avg_delivery_time || 45} min</p>
            <p className="text-xs text-muted-foreground">Tempo médio</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Bike className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">
              R$ {(establishment.delivery_base_fee || 5).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Taxa de entrega</p>
          </div>
        </div>

        {establishment.min_order_value && establishment.min_order_value > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
            <p className="text-sm">
              <span className="text-muted-foreground">Pedido mínimo: </span>
              <span className="font-bold text-amber-600">
                R$ {establishment.min_order_value.toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Order Options */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Opções de Pedido
        </h3>
        <div className="flex flex-wrap gap-2">
          {establishment.accepts_delivery && (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <Bike className="w-4 h-4" /> Delivery
            </Badge>
          )}
          {establishment.accepts_pickup && (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <Package className="w-4 h-4" /> Retirada
            </Badge>
          )}
          {establishment.accepts_table && (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <Store className="w-4 h-4" /> Mesa
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Payment Methods */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Formas de Pagamento
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <QrCode className="w-4 h-4" /> PIX
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <CreditCard className="w-4 h-4" /> Cartão
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <Banknote className="w-4 h-4" /> Dinheiro
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Social Links */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Redes Sociais
        </h3>
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full">
            <Facebook className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Instagram className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Youtube className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Globe className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
