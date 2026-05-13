// Analytics and Conversion Pixels Manager

declare global {
  interface Window {
    fbq: any;
    gtag: any;
    ttq: any;
    dataLayer: any[];
  }
}

interface PixelConfig {
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  tiktokPixelId?: string;
}

interface OrderEventData {
  orderId: string;
  total: number;
  currency?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  establishmentId?: string;
  establishmentName?: string;
}

// Initialize Facebook Pixel
// Security: Validate and sanitize pixel IDs to prevent script injection
const PIXEL_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function validatePixelId(id: string): boolean {
  return id && PIXEL_ID_REGEX.test(id) && id.length <= 50;
}

// Security: HTML entity encode to prevent XSS
function encodeForHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export const initFacebookPixel = (pixelId: string) => {
  if (!pixelId || !validatePixelId(pixelId)) {
    console.warn('[Analytics] Invalid Facebook Pixel ID format rejected');
    return;
  }
  if (typeof window === 'undefined') return;

  // Security: Encode pixel ID before interpolation
  const safePixelId = encodeForHTML(pixelId);

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${safePixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
};

// Initialize Google Analytics (GA4)
export const initGoogleAnalytics = (measurementId: string) => {
  if (!measurementId || !validatePixelId(measurementId)) {
    console.warn('[Analytics] Invalid Google Analytics ID format rejected');
    return;
  }
  if (typeof window === 'undefined') return;

  // Security: Encode measurement ID before use in URL
  const safeMeasurementId = encodeURIComponent(measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${safeMeasurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId);
};

// Initialize TikTok Pixel
export const initTiktokPixel = (pixelId: string) => {
  if (!pixelId || !validatePixelId(pixelId)) {
    console.warn('[Analytics] Invalid TikTok Pixel ID format rejected');
    return;
  }
  if (typeof window === 'undefined') return;

  // Security: Encode pixel ID before interpolation
  const safePixelId = encodeForHTML(pixelId);

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${safePixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
};

// Initialize all pixels
export const initAnalytics = (config: PixelConfig) => {
  if (config.facebookPixelId) {
    initFacebookPixel(config.facebookPixelId);
  }
  if (config.googleAnalyticsId) {
    initGoogleAnalytics(config.googleAnalyticsId);
  }
  if (config.tiktokPixelId) {
    initTiktokPixel(config.tiktokPixelId);
  }
};

// Track Page View
export const trackPageView = (pageName?: string) => {
  // Facebook
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.page();
  }
};

// Track Add to Cart
export const trackAddToCart = (item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}) => {
  // Facebook
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
      value: item.price * item.quantity,
      currency: 'BRL',
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'BRL',
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      }],
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.track('AddToCart', {
      content_id: item.id,
      content_name: item.name,
      content_type: 'product',
      value: item.price * item.quantity,
      currency: 'BRL',
      quantity: item.quantity,
    });
  }
};

// Track Initiate Checkout
export const trackInitiateCheckout = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
}>, total: number) => {
  // Facebook
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map(i => i.id),
      contents: items.map(i => ({ id: i.id, quantity: i.quantity })),
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value: total,
      currency: 'BRL',
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'BRL',
      value: total,
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.track('InitiateCheckout', {
      contents: items.map(i => ({ content_id: i.id, content_name: i.name, quantity: i.quantity, price: i.price })),
      value: total,
      currency: 'BRL',
    });
  }
};

// Track Purchase / Order Completed
export const trackPurchase = (orderData: OrderEventData) => {
  const { orderId, total, items, currency = 'BRL' } = orderData;

  // Facebook
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: items.map(i => i.id),
      contents: items.map(i => ({ id: i.id, quantity: i.quantity })),
      content_type: 'product',
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value: total,
      currency,
      order_id: orderId,
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: total,
      currency,
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
        item_category: i.category,
      })),
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.track('CompletePayment', {
      contents: items.map(i => ({
        content_id: i.id,
        content_name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      value: total,
      currency,
      order_id: orderId,
    });
  }
};

// Track View Content (Product Page)
export const trackViewContent = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) => {
  // Facebook
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'BRL',
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'BRL',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
      }],
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.track('ViewContent', {
      content_id: product.id,
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'BRL',
    });
  }
};

// Track Search
export const trackSearch = (searchTerm: string) => {
  // Facebook
  if (window.fbq) {
    window.fbq('track', 'Search', {
      search_string: searchTerm,
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.track('Search', {
      query: searchTerm,
    });
  }
};

// Track Wayfinding events (Vila "Como chegar")
export const trackWayfindingOpen = (vilaSlug: string, source: "vila_page" | "store_page" | "share" = "vila_page") => {
  if (window.gtag) {
    window.gtag('event', 'wayfinding_open', {
      event_category: 'wayfinding',
      vila_slug: vilaSlug,
      source,
    });
  }
};

export const trackWayfindingRouteCalculated = (vilaSlug: string, destinationId: string, distanceMeters: number) => {
  if (window.gtag) {
    window.gtag('event', 'wayfinding_route_calculated', {
      event_category: 'wayfinding',
      vila_slug: vilaSlug,
      destination_id: destinationId,
      distance_meters: distanceMeters,
    });
  }
};

export const trackWayfindingRouteStarted = (vilaSlug: string, destinationId: string) => {
  if (window.gtag) {
    window.gtag('event', 'wayfinding_route_started', {
      event_category: 'wayfinding',
      vila_slug: vilaSlug,
      destination_id: destinationId,
    });
  }
};

// Track Lead (Contact Form, WhatsApp, etc.)
export const trackLead = (source?: string) => {
  // Facebook
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: source,
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'engagement',
      event_label: source,
    });
  }

  // TikTok
  if (window.ttq) {
    window.ttq.track('SubmitForm', {
      content_name: source,
    });
  }
};
