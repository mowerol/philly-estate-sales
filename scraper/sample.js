// Realistic Philly-area sample sales, used to seed listings.json for the first deploy
// and as a fallback so the site is never empty. Dates are generated relative to today.

function dateFrom(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const RAW = [
  { src: "net", url: "https://www.estatesales.net", title: "Manayunk Rowhouse — Estate of a Lifelong Collector", company: "Keystone Estate Services", addr: "4400 Cresson St", city: "Philadelphia", zip: "19127", lat: 40.0246, lng: -75.2249, type: "estate", start: 4, end: 6, t0: "09:00", t1: "15:00", imgs: 42, desc: "Full house sale. Mid-century teak dining set, Danish credenza, boxes of vinyl records, a Minolta film camera with lenses, cast iron cookware, and vintage lighting throughout." },
  { src: "org", url: "https://www.estatesales.org", title: "Roxborough Downsizing Sale", company: "Ridge Ave Liquidators", addr: "6120 Ridge Ave", city: "Philadelphia", zip: "19128", lat: 40.0389, lng: -75.2233, type: "moving", start: 5, end: 6, t0: "08:00", t1: "14:00", imgs: 18, desc: "Moving sale. Garage full of hand tools and power tools, ladders, a workbench, some furniture and kitchen items. Everything must go." },
  { src: "com", url: "https://www.estatesale.com", title: "Chestnut Hill Colonial — Antiques & Fine Furnishings", company: "Germantown Ave Estates", addr: "8100 Germantown Ave", city: "Philadelphia", zip: "19118", lat: 40.0743, lng: -75.2079, type: "estate", start: 5, end: 7, t0: "10:00", t1: "16:00", imgs: 67, desc: "Period antiques, oriental rugs, sterling silver, fine china, oil paintings, a grand piano, and a library of first editions." },
  { src: "net", url: "https://www.estatesales.net", title: "Mt Airy Musician's Estate", company: "Keystone Estate Services", addr: "6700 Greene St", city: "Philadelphia", zip: "19119", lat: 40.0553, lng: -75.1877, type: "estate", start: 6, end: 7, t0: "09:00", t1: "15:00", imgs: 55, desc: "Estate of a working musician. Several guitars including a Fender, amplifiers, effects pedals, stacks of vinyl and records, plus mid-century furniture and framed concert prints." },
  { src: "org", url: "https://www.estatesales.org", title: "East Falls Apartment Clear-Out", company: "Schuylkill Sales Co", addr: "3500 W Penn St", city: "Philadelphia", zip: "19129", lat: 40.0130, lng: -75.1935, type: "tag", start: 6, end: 6, t0: "09:00", t1: "13:00", imgs: 9, desc: "Small tag sale. Books, kitchenware, a couch, IKEA shelving, and some houseplants. Quick and cheap." },
  { src: "com", url: "https://www.estatesale.com", title: "Wissahickon Mid-Century Modern Home", company: "Germantown Ave Estates", addr: "120 Kalos St", city: "Philadelphia", zip: "19128", lat: 40.0300, lng: -75.2100, type: "estate", start: 11, end: 13, t0: "10:00", t1: "16:00", imgs: 88, desc: "Time capsule mid-century home. Eames-style lounge, teak sideboards, Danish lighting, ceramic lamps, a turntable and vinyl, and a darkroom full of film photography gear and an enlarger." },
  { src: "net", url: "https://www.estatesales.net", title: "Fairmount Brownstone Estate", company: "Art Museum Estate Group", addr: "2400 Green St", city: "Philadelphia", zip: "19130", lat: 39.9680, lng: -75.1750, type: "estate", start: 12, end: 13, t0: "09:00", t1: "14:00", imgs: 34, desc: "Three floors of furniture, mid-century lighting, cast iron skillets, a coin collection, and tools in the basement workshop." },
  { src: "org", url: "https://www.estatesales.org", title: "Bala Cynwyd Online Auction — Cameras & Optics", company: "Main Line Online Auctions", addr: "Online only", city: "Bala Cynwyd", zip: "19004", lat: 40.0059, lng: -75.2346, type: "online", start: 9, end: 9, t0: "18:00", t1: "21:00", imgs: 120, desc: "Online auction. Vintage cameras, film bodies, lenses, light meters, tripods, and darkroom equipment. Local pickup available." },
  { src: "com", url: "https://www.estatesale.com", title: "Germantown Victorian — Whole House", company: "Germantown Ave Estates", addr: "5400 Wayne Ave", city: "Philadelphia", zip: "19144", lat: 40.0380, lng: -75.1750, type: "estate", start: 13, end: 14, t0: "10:00", t1: "15:00", imgs: 46, desc: "Victorian packed to the rafters. Antique furniture, quilts, glassware, holiday decor, and a garage of tools." },
  { src: "net", url: "https://www.estatesales.net", title: "Andorra Split-Level Moving Sale", company: "Keystone Estate Services", addr: "9400 Ridge Pike", city: "Philadelphia", zip: "19128", lat: 40.0700, lng: -75.2500, type: "moving", start: 4, end: 5, t0: "08:30", t1: "13:00", imgs: 14, desc: "Patio furniture, exercise equipment, a grill, garden tools, and general household goods." },
  { src: "org", url: "https://www.estatesales.org", title: "Queen Village Loft — Design & Records", company: "South Philly Sales", addr: "700 Christian St", city: "Philadelphia", zip: "19147", lat: 39.9390, lng: -75.1520, type: "tag", start: 12, end: 13, t0: "11:00", t1: "16:00", imgs: 28, desc: "Curated loft sale. Mid-century seating, a huge vinyl records collection, art books, and a pair of vintage speakers." },
  { src: "com", url: "https://www.estatesale.com", title: "Narberth Bungalow Estate", company: "Main Line Estates", addr: "220 Essex Ave", city: "Narberth", zip: "19072", lat: 40.0090, lng: -75.2600, type: "estate", start: 6, end: 7, t0: "09:00", t1: "14:00", imgs: 21, desc: "Cozy bungalow. Kitchen goods, linens, a sewing machine, some furniture, and a shed of tools." },
];

export function sampleListings() {
  return RAW.map((r) => ({
    sourceUrl: r.url,
    title: r.title,
    company: r.company,
    addressLine: r.addr,
    city: r.city,
    state: "PA",
    zip: r.zip,
    lat: r.lat,
    lng: r.lng,
    saleType: r.type,
    startDate: dateFrom(r.start),
    endDate: dateFrom(r.end),
    startTime: r.t0,
    endTime: r.t1,
    description: r.desc,
    imageCount: r.imgs,
  }));
}
