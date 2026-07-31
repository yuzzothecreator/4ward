export type DemoProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  price: number;
  pricingType: "FREE" | "PAID";
  /** Campus = student/academic; Market = commercial product for anyone */
  listingType: "CAMPUS" | "MARKET";
  license: string;
  status: string;
  coverImage: string;
  images: string[];
  demoUrl: string;
  githubRepo?: string;
  sourceFile?: string;
  technologyStack: string[];
  views: number;
  downloads: number;
  rating: number;
  reviewCount: number;
  seller: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    university: string;
    badges: string[];
  };
  createdAt: string;
};

export const demoProjects: DemoProject[] = [
  {
    id: "1",
    title: "DarLink — Campus Social Network",
    slug: "darlink-campus-social-network",
    description:
      "A full-stack social networking platform built for Tanzanian university students. Features real-time messaging, event discovery, study group matching, and a campus marketplace. Includes admin dashboard, push notifications, and role-based access.",
    shortDescription: "Full-stack campus social network with real-time chat and events.",
    category: "WEB_APPLICATIONS",
    price: 125000,
    pricingType: "PAID",
    listingType: "CAMPUS",
    license: "SOURCE_CODE",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    ],
    demoUrl: "https://example.com/demo",
    githubRepo: "https://github.com/example/darlink",
    technologyStack: ["Next.js", "TypeScript", "PostgreSQL", "Socket.io", "Tailwind CSS"],
    views: 3420,
    downloads: 186,
    rating: 4.8,
    reviewCount: 42,
    seller: {
      id: "s1",
      name: "Amina Juma",
      username: "aminajuma",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=AminaJuma",
      university: "UDSM",
      badges: ["VERIFIED_CREATOR", "TOP_SELLER"],
    },
    createdAt: "2026-03-12T10:00:00Z",
  },
  {
    id: "2",
    title: "SecureVault — Password Manager API",
    slug: "securevault-password-manager-api",
    description:
      "Enterprise-grade password manager backend with AES-256 encryption, zero-knowledge architecture, biometric auth hooks, and audit logging. Includes REST + GraphQL APIs and comprehensive documentation.",
    shortDescription: "Zero-knowledge encrypted password manager with GraphQL API.",
    category: "CYBERSECURITY",
    price: 1950000,
    pricingType: "PAID",
    listingType: "MARKET",
    license: "COMMERCIAL",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    ],
    demoUrl: "https://example.com/securevault",
    technologyStack: ["Node.js", "Python", "PostgreSQL", "Docker", "Redis"],
    views: 2105,
    downloads: 94,
    rating: 4.9,
    reviewCount: 28,
    seller: {
      id: "s2",
      name: "James Mushi",
      username: "jamesmushi",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JamesMushi",
      university: "DIT",
      badges: ["VERIFIED_CREATOR", "RISING_DEVELOPER"],
    },
    createdAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "3",
    title: "AgriSense IoT Dashboard",
    slug: "agrisense-iot-dashboard",
    description:
      "Smart agriculture monitoring system with sensor data visualization, irrigation automation, and ML-based crop yield predictions. Flutter mobile app + Next.js web dashboard.",
    shortDescription: "IoT farm monitoring with ML crop predictions.",
    category: "IOT",
    price: 150000,
    pricingType: "PAID",
    listingType: "CAMPUS",
    license: "EDUCATIONAL",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    ],
    demoUrl: "https://example.com/agrisense",
    technologyStack: ["Flutter", "Python", "Firebase", "TensorFlow", "MQTT"],
    views: 1876,
    downloads: 112,
    rating: 4.6,
    reviewCount: 19,
    seller: {
      id: "s3",
      name: "Grace Mwambene",
      username: "gracemwambene",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=GraceMwambene",
      university: "SUA",
      badges: ["RISING_DEVELOPER"],
    },
    createdAt: "2026-04-01T09:00:00Z",
  },
  {
    id: "4",
    title: "StudyBuddy AI Tutor",
    slug: "studybuddy-ai-tutor",
    description:
      "AI-powered tutoring assistant that generates quizzes, explains concepts, and tracks learning progress. Built with LangChain, OpenAI APIs, and a polished React frontend.",
    shortDescription: "AI tutor that generates quizzes and explains concepts.",
    category: "ARTIFICIAL_INTELLIGENCE",
    price: 95000,
    pricingType: "PAID",
    listingType: "CAMPUS",
    license: "SOURCE_CODE",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    ],
    demoUrl: "https://example.com/studybuddy",
    technologyStack: ["React", "Python", "OpenAI", "FastAPI", "MongoDB"],
    views: 4521,
    downloads: 301,
    rating: 4.7,
    reviewCount: 67,
    seller: {
      id: "s1",
      name: "Amina Juma",
      username: "aminajuma",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=AminaJuma",
      university: "UDSM",
      badges: ["VERIFIED_CREATOR", "TOP_SELLER"],
    },
    createdAt: "2026-01-15T11:00:00Z",
  },
  {
    id: "5",
    title: "FinTrack Mobile Wallet UI Kit",
    slug: "fintrack-mobile-wallet-ui-kit",
    description:
      "Premium Figma + React Native UI kit for fintech wallets — built for M-Pesa and mobile money flows common in Tanzania. 80+ screens, dark/light themes, and design tokens.",
    shortDescription: "80+ screen fintech wallet UI kit for React Native.",
    category: "UI_UX_DESIGNS",
    price: 850000,
    pricingType: "PAID",
    listingType: "MARKET",
    license: "COMMERCIAL",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    ],
    demoUrl: "https://example.com/fintrack",
    technologyStack: ["Figma", "React Native", "TypeScript", "Tailwind CSS"],
    views: 2890,
    downloads: 245,
    rating: 4.5,
    reviewCount: 38,
    seller: {
      id: "s4",
      name: "David Lyimo",
      username: "davidlyimo",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=DavidLyimo",
      university: "ARU",
      badges: ["VERIFIED_CREATOR"],
    },
    createdAt: "2026-05-08T16:00:00Z",
  },
  {
    id: "6",
    title: "ChainVote — Blockchain Voting DApp",
    slug: "chainvote-blockchain-voting-dapp",
    description:
      "Transparent university election system on Ethereum. Smart contracts, MetaMask integration, voter verification, and real-time results dashboard.",
    shortDescription: "Ethereum-based transparent university voting DApp.",
    category: "BLOCKCHAIN",
    price: 0,
    pricingType: "FREE",
    listingType: "CAMPUS",
    license: "EDUCATIONAL",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
    ],
    demoUrl: "https://example.com/chainvote",
    githubRepo: "https://github.com/example/chainvote",
    technologyStack: ["Solidity", "React", "Web3.js", "Hardhat", "Node.js"],
    views: 5230,
    downloads: 890,
    rating: 4.4,
    reviewCount: 51,
    seller: {
      id: "s2",
      name: "James Mushi",
      username: "jamesmushi",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JamesMushi",
      university: "DIT",
      badges: ["VERIFIED_CREATOR", "RISING_DEVELOPER"],
    },
    createdAt: "2026-03-28T08:00:00Z",
  },
  {
    id: "7",
    title: "DataPulse Analytics Engine",
    slug: "datapulse-analytics-engine",
    description:
      "End-to-end data science pipeline for student research datasets. Includes ETL scripts, Jupyter notebooks, visualization dashboards, and predictive models.",
    shortDescription: "Complete data science pipeline with predictive models.",
    category: "DATA_SCIENCE",
    price: 110000,
    pricingType: "PAID",
    listingType: "CAMPUS",
    license: "SOURCE_CODE",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    ],
    demoUrl: "https://example.com/datapulse",
    technologyStack: ["Python", "Pandas", "Scikit-learn", "Plotly", "PostgreSQL"],
    views: 1654,
    downloads: 78,
    rating: 4.6,
    reviewCount: 15,
    seller: {
      id: "s3",
      name: "Grace Mwambene",
      username: "gracemwambene",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=GraceMwambene",
      university: "SUA",
      badges: ["RISING_DEVELOPER"],
    },
    createdAt: "2026-06-02T12:00:00Z",
  },
  {
    id: "8",
    title: "MediQueue Appointment System",
    slug: "mediqueue-appointment-system",
    description:
      "Hospital appointment booking system with queue management, SMS reminders, doctor schedules, and patient records. Laravel + MySQL with responsive Blade UI.",
    shortDescription: "Hospital booking & queue system with SMS reminders.",
    category: "WEB_APPLICATIONS",
    price: 1200000,
    pricingType: "PAID",
    listingType: "MARKET",
    license: "COMMERCIAL",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    ],
    demoUrl: "https://example.com/mediqueue",
    technologyStack: ["Laravel", "MySQL", "Vue.js", "Tailwind CSS"],
    views: 1987,
    downloads: 134,
    rating: 4.3,
    reviewCount: 22,
    seller: {
      id: "s4",
      name: "David Lyimo",
      username: "davidlyimo",
      avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=DavidLyimo",
      university: "ARU",
      badges: ["VERIFIED_CREATOR"],
    },
    createdAt: "2026-04-18T15:00:00Z",
  },
];

export const demoUsers = [
  {
    id: "s1",
    name: "Amina Juma",
    username: "aminajuma",
    email: "amina@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=AminaJuma",
    role: "SELLER",
    university: "UDSM",
    bio: "Full-stack developer & CS student at UDSM. Building tools for Tanzanian campuses.",
    skills: ["Next.js", "TypeScript", "Node.js", "Python", "AI"],
    badges: ["VERIFIED_CREATOR", "TOP_SELLER"],
    totalSales: 487,
    revenue: 45200000,
  },
  {
    id: "s2",
    name: "James Mushi",
    username: "jamesmushi",
    email: "james@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JamesMushi",
    role: "SELLER",
    university: "DIT",
    bio: "Cybersecurity enthusiast and blockchain developer at DIT.",
    skills: ["Node.js", "Solidity", "Python", "Docker"],
    badges: ["VERIFIED_CREATOR", "RISING_DEVELOPER"],
    totalSales: 984,
    revenue: 18200000,
  },
  {
    id: "s3",
    name: "Grace Mwambene",
    username: "gracemwambene",
    email: "grace@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=GraceMwambene",
    role: "SELLER",
    university: "SUA",
    bio: "IoT & data science builder focused on agri-tech for Tanzania.",
    skills: ["Flutter", "Python", "TensorFlow", "MQTT"],
    badges: ["RISING_DEVELOPER"],
    totalSales: 190,
    revenue: 12600000,
  },
  {
    id: "s4",
    name: "David Lyimo",
    username: "davidlyimo",
    email: "david@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=DavidLyimo",
    role: "SELLER",
    university: "ARU",
    bio: "Product designer and full-stack engineer shipping campus tools.",
    skills: ["Figma", "React Native", "Laravel", "TypeScript"],
    badges: ["VERIFIED_CREATOR"],
    totalSales: 379,
    revenue: 24100000,
  },
];

export function getProjectBySlug(slug: string) {
  return demoProjects.find((p) => p.slug === slug);
}

export function getProjectsByUsername(username: string) {
  return demoProjects.filter((p) => p.seller.username === username);
}

export function getUserByUsername(username: string) {
  return demoUsers.find((u) => u.username === username);
}

export function filterProjects(filters: {
  category?: string;
  q?: string;
  tech?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}) {
  return demoProjects.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${p.title} ${p.description} ${p.technologyStack.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.tech && !p.technologyStack.includes(filters.tech)) return false;
    if (filters.university && p.seller.university !== filters.university) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.minRating !== undefined && p.rating < filters.minRating) return false;
    return true;
  });
}
