export const EMAIL_STOCK_IMAGES = [
  {
    id: 'luxury-home-exterior',
    category: 'property',
    label: 'Residencia premium',
    alt: 'Residencia moderna de lujo con fachada iluminada',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'modern-apartment',
    category: 'property',
    label: 'Departamento moderno',
    alt: 'Interior de departamento moderno con sala amplia',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'beach-lot',
    category: 'beach',
    label: 'Terreno de playa',
    alt: 'Vista aérea de costa tropical para inversión inmobiliaria',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'land-development',
    category: 'land',
    label: 'Terreno / desarrollo',
    alt: 'Terreno verde con camino y horizonte abierto',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'city-investment',
    category: 'investment',
    label: 'Inversión urbana',
    alt: 'Edificios urbanos modernos al atardecer',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'meeting-broker',
    category: 'lifestyle',
    label: 'Asesoría inmobiliaria',
    alt: 'Asesor inmobiliario revisando documentos con cliente',
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'family-home',
    category: 'lifestyle',
    label: 'Hogar familiar',
    alt: 'Familia entrando a una casa nueva',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'open-house',
    category: 'event',
    label: 'Open house',
    alt: 'Sala lista para visita de open house',
    url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  },
];

export const EMAIL_STOCK_IMAGE_CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'property', label: 'Propiedades' },
  { value: 'beach', label: 'Playa' },
  { value: 'land', label: 'Terrenos' },
  { value: 'investment', label: 'Inversión' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'event', label: 'Eventos' },
];

export const getDefaultStockImage = (category = 'property') => {
  return EMAIL_STOCK_IMAGES.find((image) => image.category === category) || EMAIL_STOCK_IMAGES[0];
};
