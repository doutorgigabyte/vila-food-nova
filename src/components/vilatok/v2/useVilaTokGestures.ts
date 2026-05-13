import { useCallback, useRef } from "react";
import { useGesture } from "@use-gesture/react";

/**
 * Estado da maquina de gestos. Um gesto comeca em IDLE e transiciona
 * baseado nos primeiros ~12px de movimento. Uma vez locked, fica ali
 * ate pointerup — outros eixos sao descartados.
 *
 * Resolve o conflito de 3 sistemas competindo (vertical Swiper +
 * horizontal Swiper + touch handler do Player) descrito no PRD.
 */
export type GestureState =
  | "IDLE"
  | "EVALUATING"      // primeiros 12px, ainda decidindo eixo
  | "TAP"             // pouco movimento, vai disparar tap zonal
  | "HORIZONTAL"      // trocar video do mesmo estabelecimento
  | "VERTICAL"        // trocar estabelecimento
  | "EDGE_RIGHT_PULL" // abrir perfil (drag a partir da borda direita)
  | "LONG_PRESS";     // pause

export interface VilaTokGestureDecision {
  state: GestureState;
  /** delta acumulado, signed (negativo = esquerda/cima). */
  mx: number;
  my: number;
  /** velocidade pixels/ms no momento do release. */
  vx: number;
  vy: number;
  /** posicao inicial do pointer. */
  startX: number;
  startY: number;
  /** tap zonal: 'left' | 'center' | 'right' — so populado quando state === 'TAP'. */
  tapZone?: "left" | "center" | "right";
}

export interface UseVilaTokGesturesOptions {
  /** disparado a cada frame durante drag. Use pra animar progresso. */
  onDrag?: (d: VilaTokGestureDecision) => void;
  /** disparado UMA vez no pointerdown, antes da deadzone. */
  onStart?: () => void;
  /** disparado no pointerup. State final esta em `d.state`. */
  onEnd?: (d: VilaTokGestureDecision) => void;
  /** disparado quando state vira LONG_PRESS (pode usar pra pausar video). */
  onLongPress?: () => void;
  /** disparado quando long press solta (despausa). */
  onLongPressRelease?: () => void;
  /** zona de hot-edge pra direita (em px). default 16. */
  edgePullZone?: number;
  /** deadzone pra decidir tap vs pan (em px). default 12. */
  deadzone?: number;
  /** ms ate disparar long press. default 300. */
  longPressDelay?: number;
  /** ratio pra lock de eixo (|x| > |y| * bias = horizontal). default 1.5. */
  axisLockBias?: number;
  /** desabilita gestures (ex: enquanto sheet de perfil aberto). */
  disabled?: boolean;
}

/**
 * Hook unico que substitui os 3 sistemas de gesto competindo no Vilatok.
 *
 * Uso:
 *   const bind = useVilaTokGestures({
 *     onDrag: (d) => { ... atualiza motion values ... },
 *     onEnd: (d) => {
 *       if (d.state === 'HORIZONTAL') commitHorizontal(d.mx, d.vx);
 *       if (d.state === 'VERTICAL') commitVertical(d.my, d.vy);
 *       if (d.state === 'EDGE_RIGHT_PULL') openProfileSheet();
 *       if (d.state === 'TAP') handleTap(d.tapZone);
 *     },
 *   });
 *   return <motion.div {...bind()} className="vt-pan-none vt-gpu">...</motion.div>;
 */
export function useVilaTokGestures(options: UseVilaTokGesturesOptions = {}) {
  const {
    onDrag,
    onStart,
    onEnd,
    onLongPress,
    onLongPressRelease,
    edgePullZone = 16,
    deadzone = 12,
    longPressDelay = 300,
    axisLockBias = 1.5,
    disabled = false,
  } = options;

  const stateRef = useRef<GestureState>("IDLE");
  const startRef = useRef<{ x: number; y: number; t: number }>({ x: 0, y: 0, t: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const resolveTapZone = useCallback((clientX: number): "left" | "center" | "right" => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    if (clientX < vw * 0.3) return "left";
    if (clientX > vw * 0.7) return "right";
    return "center";
  }, []);

  const decide = useCallback(
    (mx: number, my: number, startX: number): GestureState => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 0;

      // Prioridade 1: edge-right pull (perfil) — comeca na borda direita
      // e move pra esquerda (mx negativo)
      if (startX > vw - edgePullZone && mx < -8) {
        return "EDGE_RIGHT_PULL";
      }

      const adx = Math.abs(mx);
      const ady = Math.abs(my);

      // Ainda dentro da deadzone — fica em EVALUATING
      if (Math.hypot(mx, my) < deadzone) {
        return "EVALUATING";
      }

      // Lock por axis bias
      if (adx > ady * axisLockBias) return "HORIZONTAL";
      if (ady > adx * axisLockBias) return "VERTICAL";

      // Ambiguous diagonal — segura o eixo dominante no momento
      return adx >= ady ? "HORIZONTAL" : "VERTICAL";
    },
    [edgePullZone, deadzone, axisLockBias]
  );

  const bind = useGesture(
    {
      onDragStart: ({ xy: [x, y], event }) => {
        if (disabled) return;
        stateRef.current = "EVALUATING";
        startRef.current = { x, y, t: Date.now() };
        longPressTriggeredRef.current = false;

        // Long press detection — se nao houve movimento em `longPressDelay`,
        // dispara LONG_PRESS (pra pausar). Cancelado se gesto vira pan.
        clearLongPress();
        longPressTimerRef.current = setTimeout(() => {
          if (stateRef.current === "EVALUATING") {
            stateRef.current = "LONG_PRESS";
            longPressTriggeredRef.current = true;
            onLongPress?.();
          }
        }, longPressDelay);

        // Previne scroll do browser quando gesto comeca em area de hot edge
        const vw = typeof window !== "undefined" ? window.innerWidth : 0;
        if (x > vw - edgePullZone) {
          event?.preventDefault?.();
        }

        onStart?.();
      },

      onDrag: ({ movement: [mx, my], xy: [x, y] }) => {
        if (disabled) return;
        const start = startRef.current;

        // Saiu da deadzone — cancela long press e decide axis
        if (stateRef.current === "EVALUATING" && Math.hypot(mx, my) >= deadzone) {
          clearLongPress();
          stateRef.current = decide(mx, my, start.x);
        }

        // Se ja decidiu, dispara onDrag pra UI animar
        if (
          stateRef.current === "HORIZONTAL" ||
          stateRef.current === "VERTICAL" ||
          stateRef.current === "EDGE_RIGHT_PULL"
        ) {
          onDrag?.({
            state: stateRef.current,
            mx,
            my,
            vx: 0,
            vy: 0,
            startX: start.x,
            startY: start.y,
          });
        }

        // Suprimir uso de y, x diretamente — usamos start + movement
        void x;
        void y;
      },

      onDragEnd: ({ movement: [mx, my], velocity: [vx, vy], xy: [x] }) => {
        if (disabled) return;
        clearLongPress();
        const start = startRef.current;

        // Caso 1: long press estava ativo — solta sem disparar nada de pan
        if (stateRef.current === "LONG_PRESS" || longPressTriggeredRef.current) {
          onLongPressRelease?.();
          stateRef.current = "IDLE";
          return;
        }

        // Caso 2: foi tap (pouco movimento, gesto rapido)
        const dt = Date.now() - start.t;
        if (
          stateRef.current === "EVALUATING" &&
          Math.hypot(mx, my) < deadzone &&
          dt < 250
        ) {
          const decision: VilaTokGestureDecision = {
            state: "TAP",
            mx,
            my,
            vx,
            vy,
            startX: start.x,
            startY: start.y,
            tapZone: resolveTapZone(x),
          };
          onEnd?.(decision);
          stateRef.current = "IDLE";
          return;
        }

        // Caso 3: ainda em EVALUATING (gesto pequeno demais pra ser pan,
        // longo demais pra ser tap) — descarta
        if (stateRef.current === "EVALUATING") {
          stateRef.current = "IDLE";
          return;
        }

        // Caso 4: pan locked — devolve decision pro caller commitar/snapback
        onEnd?.({
          state: stateRef.current,
          mx,
          my,
          vx,
          vy,
          startX: start.x,
          startY: start.y,
        });
        stateRef.current = "IDLE";
      },

      onPointerCancel: () => {
        clearLongPress();
        if (longPressTriggeredRef.current) {
          onLongPressRelease?.();
        }
        stateRef.current = "IDLE";
      },
    },
    {
      drag: {
        // filterTaps separa tap de pan automaticamente baseado em distancia
        filterTaps: true,
        // threshold: nao dispara onDrag ate mover N pixels
        threshold: 0,
        // axis lock declarativo do use-gesture — backup pra nossa state machine
        axis: undefined,
        // bounds soltos — animation controller faz o snap
      },
    }
  );

  return bind;
}
