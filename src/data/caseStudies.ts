// Case study content. The list view shows `name` + a subline built from the
// stats; clicking a row opens the full detail (stats + the three sections).
export interface Stat {
  value: string;
  label: string;
}

export interface CaseStudy {
  name: string;
  category: string;
  stats: Stat[];
  challenge: string;
  approach: string;
  impact: string[];
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    name: "Global Outdoor Apparel Brand",
    category: "Apparel — Outdoor",
    stats: [
      { value: "10.7M+", label: "Organic Views" },
      { value: "343K+", label: "Engagements" },
      { value: "72K+", label: "Content Saves" },
      { value: "694", label: "Creator-Led Videos" },
    ],
    challenge:
      "The brand wanted to increase product discovery, drive qualified website traffic, and convert organic social engagement into apparel sales in a highly competitive market.",
    approach:
      "Built a creator-led organic content engine powered by authentic storytelling, high-volume content production, continuous creative testing, and performance-driven optimization.",
    impact: [
      "Generated 10.7M+ organic views, significantly increasing brand visibility.",
      "Increased qualified website traffic through creator-led content.",
      "Drove apparel sales by building trust and purchase intent organically.",
      "Built a scalable creator ecosystem that continues to fuel long-term organic growth.",
    ],
  },
  {
    name: "Female Health Tracking App",
    category: "Health — Mobile App",
    stats: [
      { value: "123M+", label: "Organic Views" },
      { value: "200K+", label: "App Downloads" },
      { value: "40%", label: "Lower CAC" },
    ],
    challenge:
      "45M+ negative views online led to declining trust, website traffic, app installs, and subscriptions.",
    approach:
      "Built an organic performance engine powered by creator-led content, rapid creative testing, and multi-platform distribution.",
    impact: [
      "Restored organic visibility",
      "Rebuilt consumer trust",
      "Reduced acquisition costs",
      "Created a scalable content engine",
    ],
  },
  {
    name: "Global HR SaaS Platform",
    category: "Software — HR SaaS",
    stats: [
      { value: "118.9M+", label: "Organic Views" },
      { value: "6.5M+", label: "Engagements" },
      { value: "6M+", label: "Likes" },
      { value: "374K+", label: "Shares" },
    ],
    challenge:
      "Ahead of its IPO, the company set an ambitious goal of making its brand recognizable to 100 million people worldwide through organic marketing.",
    approach:
      "Built a creator-led organic content engine powered by humour niche content, niche creator communities, and continuous performance optimization.",
    impact: [
      "Surpassed the 100M brand awareness goal.",
      "Increased global brand visibility and website traffic.",
      "Strengthened category leadership before the IPO.",
      "Built a scalable creator-powered growth engine.",
    ],
  },
  {
    name: "Premium Skincare Brand",
    category: "Beauty — Skincare",
    stats: [
      { value: "7.9M+", label: "Organic Views" },
      { value: "600+", label: "Content Pieces Produced" },
      { value: "11.3%", label: "Peak Engagement Rate" },
      { value: "30K+", label: "Content Saves" },
    ],
    challenge:
      "The brand wanted to stand out in a highly competitive skincare market by building trust, educating consumers, and driving organic product discovery through creator-led content.",
    approach:
      "Built a data-driven organic content engine focused on educational storytelling, continuous creative testing, and performance optimization to identify and scale winning content formats.",
    impact: [
      "Generated 7.9M+ organic views through scalable content production.",
      "Reached the brand's ideal audience with highly targeted educational content.",
      "Increased product consideration through high-value, save-worthy content.",
      "Built a repeatable content engine that consistently scaled organic growth.",
    ],
  },
];
