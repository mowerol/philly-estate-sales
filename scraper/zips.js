// Approximate centroid coordinates for zip codes in and around Philadelphia.
// Good enough for radius filtering / picking nearby query anchors — not meant for
// precise geocoding. Add more entries as needed; never invent coordinates for a zip
// that isn't listed here.
export const ZIP_CENTROIDS = {
  // Philadelphia proper
  "19102": { state: "PA", lat: 39.9520, lng: -75.1660 },
  "19103": { state: "PA", lat: 39.9500, lng: -75.1730 },
  "19104": { state: "PA", lat: 39.9600, lng: -75.2000 },
  "19106": { state: "PA", lat: 39.9490, lng: -75.1460 },
  "19107": { state: "PA", lat: 39.9530, lng: -75.1580 },
  "19111": { state: "PA", lat: 40.0620, lng: -75.0850 },
  "19114": { state: "PA", lat: 40.0730, lng: -75.0170 },
  "19115": { state: "PA", lat: 40.1000, lng: -75.0450 },
  "19116": { state: "PA", lat: 40.1170, lng: -75.0140 },
  "19118": { state: "PA", lat: 40.0743, lng: -75.2079 },
  "19119": { state: "PA", lat: 40.0553, lng: -75.1877 },
  "19120": { state: "PA", lat: 40.0380, lng: -75.1180 },
  "19121": { state: "PA", lat: 39.9800, lng: -75.1770 },
  "19124": { state: "PA", lat: 40.0090, lng: -75.1080 },
  "19125": { state: "PA", lat: 39.9720, lng: -75.1330 },
  "19127": { state: "PA", lat: 40.0257, lng: -75.2260 },
  "19128": { state: "PA", lat: 40.0389, lng: -75.2233 },
  "19129": { state: "PA", lat: 40.0130, lng: -75.1935 },
  "19130": { state: "PA", lat: 39.9680, lng: -75.1750 },
  "19131": { state: "PA", lat: 39.9900, lng: -75.2280 },
  "19132": { state: "PA", lat: 39.9980, lng: -75.1600 },
  "19134": { state: "PA", lat: 39.9950, lng: -75.1020 },
  "19136": { state: "PA", lat: 40.0450, lng: -75.0490 },
  "19138": { state: "PA", lat: 40.0570, lng: -75.1520 },
  "19139": { state: "PA", lat: 39.9660, lng: -75.2320 },
  "19140": { state: "PA", lat: 40.0180, lng: -75.1500 },
  "19141": { state: "PA", lat: 40.0330, lng: -75.1450 },
  "19143": { state: "PA", lat: 39.9440, lng: -75.2270 },
  "19144": { state: "PA", lat: 40.0380, lng: -75.1750 },
  "19145": { state: "PA", lat: 39.9160, lng: -75.1890 },
  "19146": { state: "PA", lat: 39.9410, lng: -75.1780 },
  "19147": { state: "PA", lat: 39.9390, lng: -75.1520 },
  "19148": { state: "PA", lat: 39.9210, lng: -75.1670 },
  "19149": { state: "PA", lat: 40.0430, lng: -75.0670 },
  "19150": { state: "PA", lat: 40.0730, lng: -75.1600 },
  "19151": { state: "PA", lat: 39.9880, lng: -75.2470 },
  "19152": { state: "PA", lat: 40.0680, lng: -75.0680 },
  "19153": { state: "PA", lat: 39.8940, lng: -75.2360 },
  "19154": { state: "PA", lat: 40.0940, lng: -75.0090 },

  // Nearby PA suburbs
  "19004": { state: "PA", lat: 40.0059, lng: -75.2346 }, // Bala Cynwyd
  "19003": { state: "PA", lat: 40.0075, lng: -75.2924 }, // Ardmore
  "19010": { state: "PA", lat: 40.0210, lng: -75.3160 }, // Bryn Mawr
  "19035": { state: "PA", lat: 40.0350, lng: -75.2800 }, // Gladwyne
  "19066": { state: "PA", lat: 40.0070, lng: -75.2470 }, // Merion Station
  "19072": { state: "PA", lat: 40.0090, lng: -75.2600 }, // Narberth
  "19096": { state: "PA", lat: 40.0050, lng: -75.3020 }, // Wynnewood
  "19008": { state: "PA", lat: 39.9930, lng: -75.3580 }, // Broomall
  "19063": { state: "PA", lat: 39.9160, lng: -75.3880 }, // Media
  "19064": { state: "PA", lat: 39.9310, lng: -75.3300 }, // Springfield
  "19018": { state: "PA", lat: 39.9130, lng: -75.3020 }, // Clifton Heights
  "19026": { state: "PA", lat: 39.9410, lng: -75.2980 }, // Drexel Hill
  "19082": { state: "PA", lat: 39.9390, lng: -75.2790 }, // Lansdowne
  "19023": { state: "PA", lat: 39.9180, lng: -75.2620 }, // Darby
  "19002": { state: "PA", lat: 40.1580, lng: -75.2210 }, // Ambler
  "19031": { state: "PA", lat: 40.0740, lng: -75.1290 }, // Elkins Park
  "19038": { state: "PA", lat: 40.1000, lng: -75.1520 }, // Glenside
  "19090": { state: "PA", lat: 40.1450, lng: -75.1220 }, // Willow Grove
  "19422": { state: "PA", lat: 40.1470, lng: -75.2740 }, // Blue Bell
  "19401": { state: "PA", lat: 40.1210, lng: -75.3400 }, // Norristown
  "18966": { state: "PA", lat: 40.1740, lng: -75.0130 }, // Southampton
  "18974": { state: "PA", lat: 40.2070, lng: -75.0970 }, // Warminster

  // Nearby NJ suburbs
  "08002": { state: "NJ", lat: 39.9340, lng: -75.0230 }, // Cherry Hill
  "08003": { state: "NJ", lat: 39.9040, lng: -74.9990 }, // Cherry Hill
  "08033": { state: "NJ", lat: 39.8930, lng: -75.0370 }, // Haddonfield
  "08034": { state: "NJ", lat: 39.9280, lng: -75.0450 }, // Cherry Hill
  "08109": { state: "NJ", lat: 39.9750, lng: -75.0570 }, // Pennsauken
  "08110": { state: "NJ", lat: 39.9700, lng: -75.0700 }, // Pennsauken
  "08108": { state: "NJ", lat: 39.9080, lng: -75.0790 }, // Oaklyn
  "08029": { state: "NJ", lat: 39.8900, lng: -75.1180 }, // Gloucester City
};
