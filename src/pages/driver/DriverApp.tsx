import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDriverDeliveries, DeliveryTracking } from '@/hooks/useDriverDeliveries';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import GPSStatusIndicator from '@/components/driver/GPSStatusIndicator';
import DriverHistory from './DriverHistory';
import { 
  Bike, 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  DollarSign,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  User,
  LogOut,
  Loader2,
  Volume2,
  VolumeX,
  Zap,
  Layers,
  Route
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DriverApp = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    deliveries,
    currentDelivery,
    driverProfile,
    isLoading,
    isOnline,
    toggleOnlineStatus,
    updateDeliveryStatus,
    getTodayStats
  } = useDriverDeliveries();

  // GPS tracking
  const { 
    position: gpsPosition, 
    isTracking: isGPSTracking, 
    error: gpsError, 
    lastUpdate: gpsLastUpdate,
    startTracking,
    stopTracking 
  } = useDriverGPS({ 
    deliveryId: currentDelivery?.id,
    updateInterval: 15000 // Update every 15 seconds
  });

  // Notification sounds
  const { playNotification, preferences: soundPrefs, updatePreferences } = useNotificationSound();

  const [stats, setStats] = useState({ deliveries: 0, earnings: 0, distance: 0 });
  const [activeTab, setActiveTab] = useState<'deliveries' | 'history' | 'profile'>('deliveries');
  const [batchInfo, setBatchInfo] = useState<{ batch_id?: string; order_in_batch?: number; total_in_batch?: number } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await getTodayStats();
      setStats(data);
    };
    loadStats();
  }, [getTodayStats]);

  // Play sound on new delivery
  useEffect(() => {
    if (deliveries.length > 0 && deliveries.some(d => d.status === 'assigned')) {
      playNotification('new_delivery');
    }
  }, [deliveries, playNotification]);

  // Start/stop GPS based on online status
  useEffect(() => {
    if (isOnline && currentDelivery) {
      startTracking();
    } else if (!isOnline) {
      stopTracking();
    }
  }, [isOnline, currentDelivery, startTracking, stopTracking]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground text-center mb-4">
          Você não está cadastrado como entregador.
        </p>
        <Button onClick={() => signOut()}>Sair</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    assigned: 'bg-yellow-500',
    accepted: 'bg-blue-500',
    picked_up: 'bg-purple-500',
    in_transit: 'bg-orange-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
    problem: 'bg-red-500'
  };

  const statusLabels: Record<string, string> = {
    assigned: 'Aguardando',
    accepted: 'Aceito',
    picked_up: 'Coletado',
    in_transit: 'Em Trânsito',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    problem: 'Problema'
  };

  // Check if delivery is part of a batch
  const isBatchDelivery = (delivery: DeliveryTracking) => {
    return delivery.order?.delivery_type === 'turbo' || deliveries.length > 1;
  };

  // Group deliveries by route order
  const sortedDeliveries = [...deliveries].sort((a, b) => {
    // Priority: in_transit > picked_up > accepted > assigned
    const priority: Record<string, number> = {
      in_transit: 0,
      picked_up: 1,
      accepted: 2,
      assigned: 3
    };
    return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
  });

  const renderDeliveryCard = (delivery: DeliveryTracking, index: number) => {
    const order = delivery.order;
    const establishment = delivery.establishment;
    const address = order?.delivery_address;
    const isTurbo = order?.delivery_type === 'turbo';
    const isMultiBatch = deliveries.length > 1;

    return (
      <Card key={delivery.id} className={`mb-4 ${isTurbo ? 'border-yellow-500 border-2' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMultiBatch && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </div>
              )}
              <Avatar className="w-10 h-10">
                <AvatarImage src={establishment?.logo_url || ''} />
                <AvatarFallback>{establishment?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {establishment?.name}
                  {isTurbo && (
                    <Badge className="bg-yellow-500 text-black">
                      <Zap className="w-3 h-3 mr-1" />
                      TURBO
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pedido #{order?.order_number}
                </p>
              </div>
            </div>
            <Badge className={statusColors[delivery.status]}>
              {statusLabels[delivery.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pickup Address */}
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 mt-1 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Retirada</p>
              <p className="text-sm">{establishment?.address}</p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className="text-sm">
                {address?.street}, {address?.number}
                {address?.complement && ` - ${address.complement}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {address?.neighborhood} - {address?.city}
              </p>
            </div>
          </div>

          {/* Order Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                R$ {order?.total?.toFixed(2)}
              </span>
              {delivery.estimated_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {delivery.estimated_minutes} min
                </span>
              )}
            </div>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(delivery.created_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {delivery.status === 'assigned' && (
              <>
                <Button 
                  className="flex-1"
                  onClick={() => updateDeliveryStatus(delivery.id, 'accepted')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aceitar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => updateDeliveryStatus(delivery.id, 'cancelled')}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}

            {delivery.status === 'accepted' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(establishment?.address || '')}`,
                      '_blank'
                    );
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navegar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Coletei
                </Button>
              </>
            )}

            {delivery.status === 'picked_up' && (
              <Button 
                className="flex-1"
                onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
              >
                <Bike className="w-4 h-4 mr-2" />
                Iniciar Entrega
              </Button>
            )}

            {delivery.status === 'in_transit' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const addr = `${address?.street}, ${address?.number}, ${address?.neighborhood}, ${address?.city}`;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`,
                      '_blank'
                    );
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navegar
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Entreguei
                </Button>
              </>
            )}

            {/* Phone button */}
            {order?.customer?.phone && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(`tel:${order.customer?.phone}`, '_self')}
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary-foreground">
              <AvatarFallback>{driverProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">{driverProfile.name}</h1>
              <p className="text-sm opacity-80">{driverProfile.vehicle_type || 'Moto'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              onClick={() => updatePreferences({ sound_enabled: !soundPrefs.sound_enabled })}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {soundPrefs.sound_enabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 opacity-50" />
              )}
            </button>
            
            {/* GPS Status */}
            <GPSStatusIndicator
              isTracking={isGPSTracking}
              hasError={!!gpsError}
              lastUpdate={gpsLastUpdate}
              accuracy={gpsPosition?.accuracy}
              className="bg-white/10"
            />
            
            {/* Online toggle */}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              <Switch
                checked={isOnline}
                onCheckedChange={toggleOnlineStatus}
              />
            </div>
          </div>
        </div>

        {/* Today's Stats - Simplified (no earnings - establishment pays directly) */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.deliveries}</p>
            <p className="text-xs opacity-80">Entregas Hoje</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.distance.toFixed(1)}</p>
            <p className="text-xs opacity-80">Km rodados</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'deliveries' && (
          <>
            {!isOnline && (
              <Card className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm">Fique online para receber novas entregas</p>
                </CardContent>
              </Card>
            )}

            {sortedDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Bike className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Nenhuma entrega</h2>
                <p className="text-muted-foreground">
                  {isOnline 
                    ? 'Aguarde novas entregas...'
                    : 'Fique online para receber entregas'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Batch summary if multiple deliveries */}
                {sortedDeliveries.length > 1 && (
                  <Card className="mb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Lote com {sortedDeliveries.length} entregas</p>
                          <p className="text-sm text-muted-foreground">Siga a ordem numerada para otimizar sua rota</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Open Google Maps with all delivery addresses
                            const addresses = sortedDeliveries
                              .filter(d => d.order?.delivery_address)
                              .map(d => {
                                const addr = d.order?.delivery_address;
                                return `${addr?.street}, ${addr?.number}, ${addr?.city}`;
                              });
                            if (addresses.length > 0) {
                              const waypoints = addresses.slice(0, -1).join('|');
                              const destination = addresses[addresses.length - 1];
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`,
                                '_blank'
                              );
                            }
                          }}
                        >
                          <Route className="w-4 h-4 mr-1" />
                          Rota
                        </Button>
                      </div>
                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{sortedDeliveries.filter(d => d.status === 'delivered').length}/{sortedDeliveries.length}</span>
                        </div>
                        <Progress 
                          value={(sortedDeliveries.filter(d => d.status === 'delivered').length / sortedDeliveries.length) * 100} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                <ScrollArea className="h-[calc(100vh-380px)]">
                  {sortedDeliveries.map((delivery, index) => renderDeliveryCard(delivery, index))}
                </ScrollArea>
              </>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <DriverHistory />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p>{driverProfile.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p>{driverProfile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bike className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Veículo</p>
                    <p>{driverProfile.vehicle_type} - {driverProfile.license_plate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
        <div className="flex justify-around">
          <button
            className={`flex flex-col items-center p-2 ${activeTab === 'deliveries' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('deliveries')}
          >
            <Bike className="w-6 h-6" />
            <span className="text-xs mt-1">Entregas</span>
          </button>
          <button
            className={`flex flex-col items-center p-2 ${activeTab === 'history' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-6 h-6" />
            <span className="text-xs mt-1">Histórico</span>
          </button>
          <button
            className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverApp;
