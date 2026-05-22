// Shared city catalogue for the whole app.
//
// `value` is the slug stored in the DB and matched by the listings API
// (exact, case-insensitive), so these slugs must stay stable. `label` is the
// Russian display name and `img` is the cover used on the home / neighbourhood
// pages. Add a city here and it lights up everywhere that imports this module.
export const CITIES = [
  {
    value: "almaty",
    label: "Алматы",
    img: "https://images.unsplash.com/photo-1594823976738-35aefcc1c87a?auto=format&fit=crop&w=800&q=60",
  },
  {
    value: "astana",
    label: "Астана",
    img: "https://images.unsplash.com/photo-1564509370334-5b6b81f1f9cc?auto=format&fit=crop&w=800&q=60",
  },
  {
    value: "shymkent",
    label: "Шымкент",
    img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=60",
  },
  {
    value: "karaganda",
    label: "Караганда",
    img: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?auto=format&fit=crop&w=800&q=60",
  },
  {
    value: "pavlodar",
    label: "Павлодар",
    img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=60",
  },
];

export const CITY_LABELS = Object.fromEntries(
  CITIES.map((c) => [c.value, c.label])
);

// Russian label for a city slug, falling back to the raw slug for unknowns.
export const cityLabel = (value) => CITY_LABELS[value] || value;

// Options for <Select>. Pass { includeAll: true } to prepend "Все города".
export const cityOptions = ({ includeAll = false } = {}) => {
  const base = CITIES.map(({ value, label }) => ({ value, label }));
  return includeAll ? [{ label: "Все города", value: "" }, ...base] : base;
};
