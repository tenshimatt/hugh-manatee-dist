// Real JWM project portfolio (source: jwmcd.com/portfolio)
// Used as reference customers + visual content throughout the demo.

export type JwmProject = {
  slug: string;
  name: string;
  location: string;
  year: string;
  sqft: number;
  services: "Fabrication" | "Fabrication & Installation" | "Design, Fabrication & Installation";
  image: string;
  division: "Architectural" | "Processing" | "Mixed";
};

export const PROJECTS: JwmProject[] = [
  { slug: "convexity", name: "Convexity Business Center", location: "Nashville, TN", year: "2024", sqft: 33700, services: "Fabrication & Installation", image: "/projects/convexity.jpg", division: "Architectural" },
  { slug: "google-dc", name: "Google Data Center", location: "New Albany, OH", year: "2023", sqft: 30433, services: "Fabrication & Installation", image: "/projects/google-dc.jpg", division: "Architectural" },
  { slug: "bna", name: "Nashville International Airport (BNA)", location: "Nashville, TN", year: "2018–Ongoing", sqft: 608000, services: "Fabrication & Installation", image: "/projects/bna.jpg", division: "Architectural" },
  { slug: "flexjet", name: "FlexJet", location: "Richmond Heights, OH", year: "2023", sqft: 21580, services: "Fabrication", image: "/projects/flexjet.jpg", division: "Processing" },
  { slug: "tempo-hilton", name: "Tempo by Hilton Nashville Downtown", location: "Nashville, TN", year: "2022", sqft: 71500, services: "Fabrication & Installation", image: "/projects/tempo-hilton.jpg", division: "Architectural" },
  { slug: "att", name: "AT&T Building", location: "Nashville, TN", year: "2022", sqft: 99640, services: "Fabrication & Installation", image: "/projects/att.jpg", division: "Architectural" },
  { slug: "fifth-broadway", name: "Fifth + Broadway", location: "Nashville, TN", year: "2019", sqft: 106302, services: "Fabrication", image: "/projects/fifth-broadway.jpg", division: "Mixed" },
  { slug: "music-city", name: "Music City Center", location: "Nashville, TN", year: "2013", sqft: 200000, services: "Fabrication & Installation", image: "/projects/music-city.jpg", division: "Architectural" },
  { slug: "ford-center", name: "Ford Center", location: "Evansville, IN", year: "2011", sqft: 290000, services: "Fabrication", image: "/projects/ford-center.jpg", division: "Architectural" },
  { slug: "fedex", name: "FedEx World Headquarters", location: "Memphis, TN", year: "2004", sqft: 64800, services: "Design, Fabrication & Installation", image: "/projects/fedex.jpg", division: "Mixed" },
  { slug: "moore", name: "Moore Building", location: "Nashville, TN", year: "2022", sqft: 70000, services: "Fabrication & Installation", image: "/projects/moore.jpg", division: "Architectural" },
  { slug: "kenect", name: "Kenect Luxury Apartments", location: "Nashville, TN", year: "2020", sqft: 101477, services: "Fabrication & Installation", image: "/projects/kenect.jpg", division: "Architectural" },
  { slug: "uvm", name: "University of Vermont Medical Center", location: "Burlington, VT", year: "2019", sqft: 76189, services: "Fabrication & Installation", image: "/projects/uvm.jpg", division: "Architectural" },
  { slug: "mcw", name: "Medical College of Wisconsin", location: "Milwaukee, WI", year: "2018", sqft: 75000, services: "Fabrication", image: "/projects/mcw.jpg", division: "Architectural" },
  { slug: "jlr", name: "Jaguar/Land Rover Chattanooga", location: "Chattanooga, TN", year: "2020", sqft: 12115, services: "Fabrication & Installation", image: "/projects/jlr.jpg", division: "Architectural" },
  { slug: "prima", name: "Prima at Paseo South Gulch", location: "Nashville, TN", year: "2023", sqft: 7924, services: "Fabrication & Installation", image: "/projects/prima.jpg", division: "Architectural" },
  { slug: "lea", name: "805 Lea High-Rise", location: "Nashville, TN", year: "2020", sqft: 196317, services: "Fabrication & Installation", image: "/projects/lea.jpg", division: "Architectural" },
  { slug: "ensley", name: "Ensley Office Development", location: "Nashville, TN", year: "2024", sqft: 21426, services: "Fabrication", image: "/projects/ensley.jpg", division: "Architectural" },
  { slug: "lincoln", name: "Lincoln at Bankside Apartments", location: "Bronx, NY", year: "2023", sqft: 28435, services: "Fabrication", image: "/projects/lincoln.jpg", division: "Architectural" },
  { slug: "paretti", name: "Paretti Mazda", location: "Covington, LA", year: "2022", sqft: 7119, services: "Fabrication & Installation", image: "/projects/paretti.jpg", division: "Architectural" },
];

export const FEATURED_PROJECTS = PROJECTS.slice(0, 8);
