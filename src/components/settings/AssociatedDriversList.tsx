import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { DriverInviteModal } from "./DriverInviteModal";
import { 
  Users, 
  Bike, 
  Car, 
  Phone,
  MapPin,
  RefreshCw,
  UserPlus
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  is_active: boolean;
  is_available: boolean;
  total_deliveries: number;
  rating_average: number | null;
  email: string | null;
}

interface AssociatedDriversListProps {
  establishmentId: string | null;
}

export const AssociatedDriversList = ({ establishmentId }: AssociatedDriversListProps) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDeliveries, setTodayDeliveries] = useState<Record<string, number>>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [establishmentName, setEstablishmentName] = useState<string>("");

  // Fetch establishment name for the modal
  useEffect(() => {
    if (establishmentId) {
      supabase
        .from("establishments")
        .select("name")
        .eq("id", establishmentId)
        .single()
        .then(({ data }) => {
          if (data) setEstablishmentName(data.name);
        });
    }
  }, [establishmentId]);
  useEffect(() => {
    if (establishmentId) {
      fetchDrivers();
    }
  }, [establishmentId]);

  const fetchDrivers = async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      // Fetch drivers linked to this establishment
      const { data: links, error: linksError } = await supabase
        .from("driver_establishment_links")
        .select(`
          driver_id,
          status,
          delivery_drivers (
            id, name, phone, vehicle_type, is_active, is_available,
            total_deliveries, rating_average, email
          )
        `)
        .eq("establishment_id", establishmentId)
        .eq("status", "approved");

      if (linksError) throw linksError;

      const driversList = links
        ?.map(link => link.delivery_drivers)
        .filter(Boolean) as Driver[];

      setDrivers(driversList || []);

      // Fetch today's deliveries for each driver
      const today = new Date().toISOString().split('T')[0];
      const { data: deliveries, error: deliveriesError } = await supabase
        .from("delivery_tracking")
        .select("driver_id")
        .eq("establishment_id", establishmentId)
        .eq("status", "delivered")
        .gte("delivered_at", `${today}T00:00:00`)
        .lte("delivered_at", `${today}T23:59:59`);

      if (!deliveriesError && deliveries) {
        const counts: Record<string, number> = {};
        deliveries.forEach(d => {
          counts[d.driver_id] = (counts[d.driver_id] || 0) + 1;
        });
        setTodayDeliveries(counts);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type: string | null) => {
    if (type === "car") return <Car className="w-4 h-4" />;
    return <Bike className="w-4 h-4" />;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Entregadores Associados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Entregadores Associados
            </CardTitle>
            <CardDescription>
              {drivers.length} entregador{drivers.length !== 1 ? "es" : ""} vinculado{drivers.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDrivers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {drivers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Nenhum entregador associado ainda
            </p>
            <Button variant="outline" onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Entregador
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map(driver => (
              <div 
                key={driver.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                      driver.is_available ? "bg-green-500" : "bg-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{driver.name}</p>
                      {getVehicleIcon(driver.vehicle_type)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {driver.phone}
                      </span>
                      {driver.rating_average && (
                        <span className="flex items-center gap-1">
                          ⭐ {driver.rating_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant={driver.is_available ? "default" : "secondary"}>
                      {driver.is_available ? "Online" : "Offline"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hoje: {todayDeliveries[driver.id] || 0} entrega{(todayDeliveries[driver.id] || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Invite button when there are drivers */}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Entregador
            </Button>
          </div>
        )}
      </CardContent>

      {/* Invite Modal */}
      {establishmentId && (
        <DriverInviteModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          establishmentId={establishmentId}
          establishmentName={establishmentName}
        />
      )}
    </Card>
  );
};
