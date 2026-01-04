// Sample topics data - Indian news topics with tags
export const topics = [
  {
    id: 1,
    title: "Union Budget 2026",
    tags: ["economy", "government", "policy"],
    color: "#FF6B6B",
    description: "Key highlights from the annual budget presentation"
  },
  {
    id: 2,
    title: "RBI Interest Rates",
    tags: ["economy", "banking", "policy"],
    color: "#4ECDC4",
    description: "Reserve Bank monetary policy decisions"
  },
  {
    id: 3,
    title: "Stock Market Rally",
    tags: ["economy", "markets", "business"],
    color: "#45B7D1",
    description: "Sensex and Nifty reach new highs"
  },
  {
    id: 4,
    title: "Digital India Initiative",
    tags: ["technology", "government", "policy"],
    color: "#96CEB4",
    description: "Government's push for digital transformation"
  },
  {
    id: 5,
    title: "5G Expansion",
    tags: ["technology", "telecom", "business"],
    color: "#FFEAA7",
    description: "Telecom companies rolling out 5G networks"
  },
  {
    id: 6,
    title: "Climate Action Plan",
    tags: ["environment", "government", "policy"],
    color: "#74B9FF",
    description: "India's commitments to reduce carbon emissions"
  },
  {
    id: 7,
    title: "IPL 2026 Season",
    tags: ["sports", "cricket", "entertainment"],
    color: "#FD79A8",
    description: "Indian Premier League updates and scores"
  },
  {
    id: 8,
    title: "Startup Funding Boom",
    tags: ["business", "technology", "economy"],
    color: "#A29BFE",
    description: "Indian startups attracting record investments"
  },
  {
    id: 9,
    title: "Education Reform",
    tags: ["education", "government", "policy"],
    color: "#00B894",
    description: "New education policy implementation updates"
  },
  {
    id: 10,
    title: "Healthcare Expansion",
    tags: ["health", "government", "policy"],
    color: "#E17055",
    description: "Government healthcare scheme reaches more citizens"
  },
  {
    id: 11,
    title: "Electric Vehicle Push",
    tags: ["technology", "environment", "business"],
    color: "#00CEC9",
    description: "India's transition to electric mobility"
  },
  {
    id: 12,
    title: "Monsoon Forecast",
    tags: ["weather", "agriculture", "environment"],
    color: "#6C5CE7",
    description: "IMD predictions for the upcoming monsoon season"
  }
];

// Get all unique tags
export const getAllTags = () => {
  const tagSet = new Set();
  topics.forEach(topic => topic.tags.forEach(tag => tagSet.add(tag)));
  return Array.from(tagSet).sort();
};
