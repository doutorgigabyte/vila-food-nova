"use client"

import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion"

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  const handleChange = () => {
    setMatches(getMatches(query))
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)
    handleChange()

    matchMedia.addEventListener("change", handleChange)

    return () => {
      matchMedia.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1] as const }
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }

export interface CarouselCard {
  id: string
  imageUrl: string
  title?: string
  subtitle?: string
  price?: number
  link?: string
}

interface CarouselProps {
  handleClick: (card: CarouselCard, index: number) => void
  controls: ReturnType<typeof useAnimation>
  cards: CarouselCard[]
  isCarouselActive: boolean
  renderCard?: (card: CarouselCard, isCenter: boolean) => React.ReactNode
}

const Carousel = memo(
  ({
    handleClick,
    controls,
    cards,
    isCarouselActive,
    renderCard,
  }: CarouselProps) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const cylinderWidth = isScreenSizeSm ? 1100 : 1800
    const faceCount = cards.length
    const faceWidth = cylinderWidth / faceCount
    const radius = cylinderWidth / (2 * Math.PI)
    const rotation = useMotionValue(0)
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    )

    return (
      <div
        className="flex h-full items-center justify-center bg-background"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) =>
            isCarouselActive &&
            rotation.set(rotation.get() + info.offset.x * 0.05)
          }
          onDragEnd={(_, info) =>
            isCarouselActive &&
            controls.start({
              rotateY: rotation.get() + info.velocity.x * 0.05,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 30,
                mass: 0.1,
              },
            })
          }
          animate={controls}
        >
          {cards.map((card, i) => (
            <motion.div
              key={`key-${card.id}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-xl bg-background p-2"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(card, i)}
            >
              {renderCard ? (
                renderCard(card, false)
              ) : (
                <motion.img
                  src={card.imageUrl}
                  alt={card.title || `Card ${i}`}
                  layoutId={`img-${card.id}`}
                  className="pointer-events-none w-full rounded-xl object-cover aspect-square"
                  initial={{ filter: "blur(4px)" }}
                  layout="position"
                  animate={{ filter: "blur(0px)" }}
                  transition={transition}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }
)

Carousel.displayName = "Carousel"

interface ThreeDPhotoCarouselProps {
  cards?: CarouselCard[]
  renderCard?: (card: CarouselCard, isCenter: boolean) => React.ReactNode
  onCardClick?: (card: CarouselCard) => void
  height?: string
}

function ThreeDPhotoCarousel({ 
  cards: externalCards, 
  renderCard,
  onCardClick,
  height = "500px"
}: ThreeDPhotoCarouselProps) {
  const [activeCard, setActiveCard] = useState<CarouselCard | null>(null)
  const [isCarouselActive, setIsCarouselActive] = useState(true)
  const controls = useAnimation()
  
  const defaultCards = useMemo(
    () => [
      { id: "1", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", title: "Pizza" },
      { id: "2", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", title: "Burger" },
      { id: "3", imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400", title: "Dessert" },
      { id: "4", imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", title: "Pancakes" },
      { id: "5", imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400", title: "Salad" },
    ],
    []
  )

  const cards = externalCards || defaultCards

  const handleClick = (card: CarouselCard) => {
    if (onCardClick) {
      onCardClick(card)
      return
    }
    setActiveCard(card)
    setIsCarouselActive(false)
    controls.stop()
  }

  const handleClose = () => {
    setActiveCard(null)
    setIsCarouselActive(true)
  }

  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="sync">
        {activeCard && !onCardClick && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`img-container-${activeCard.id}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5 md:p-36"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            <motion.div className="bg-card rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full">
              <motion.img
                layoutId={`img-${activeCard.id}`}
                src={activeCard.imageUrl}
                alt={activeCard.title}
                className="w-full aspect-video object-cover"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ willChange: "transform" }}
              />
              {activeCard.title && (
                <div className="p-6">
                  {activeCard.subtitle && (
                    <p className="text-sm text-muted-foreground mb-1">{activeCard.subtitle}</p>
                  )}
                  <h3 className="text-xl font-bold text-foreground">{activeCard.title}</h3>
                  {activeCard.price && (
                    <p className="text-lg font-bold text-primary mt-2">
                      R$ {activeCard.price.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <Carousel
          handleClick={handleClick}
          controls={controls}
          cards={cards}
          isCarouselActive={isCarouselActive}
          renderCard={renderCard}
        />
      </div>
    </motion.div>
  )
}

export { ThreeDPhotoCarousel, Carousel }
