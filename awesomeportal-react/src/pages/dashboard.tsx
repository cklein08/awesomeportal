/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useContext, useRef } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Grid } from "@mui/material";

// import categorizer from utils (services folder not present)
import {
  applyCategoryRules,
  defaultRules,
  CategoryRule,
} from "../utils/assetCategorizer";
// read rules from AppConfigContext
import { AppConfigContext } from "../contexts/AppConfigContext";

type Asset = {
  id: string;
  name: string;
  category: string;
  campaign: string;
  usage: string;
};

// Default sample assets to allow the dashboard to render graphs
// when the API is unavailable or returns no results. Useful for
// local development and demos.
const DEFAULT_ASSETS: Asset[] = [
  { id: "a1", name: "Banner Hero", category: "Marketing", campaign: "Spring 2025", usage: "Web" },
  { id: "a2", name: "Logo Primary", category: "Brand", campaign: "Brand Refresh", usage: "Print" },
  { id: "a3", name: "Email Header", category: "Marketing", campaign: "Spring 2025", usage: "Email" },
  { id: "a4", name: "Landing Video", category: "Media", campaign: "Launch", usage: "Video" },
  { id: "a5", name: "Product Photo", category: "Product", campaign: "Q2 Promo", usage: "Web" },
  { id: "a6", name: "Thumbnail", category: "Product", campaign: "Q2 Promo", usage: "Mobile" },
  { id: "a7", name: "Press Kit", category: "PR", campaign: "Launch", usage: "Print" },
  { id: "a8", name: "Social Card", category: "Marketing", campaign: "Social Push", usage: "Social" },
  { id: "a9", name: "Icon Set", category: "Brand", campaign: "Brand Refresh", usage: "Web" },
  { id: "a10", name: "Case Study PDF", category: "Sales", campaign: "Account Program", usage: "Download" },
];

const fetchAssets = async (rules: CategoryRule[]): Promise<Asset[]> => {
  try {
    const resp = await fetch("/api/assets"); // keep your search endpoint
    if (!resp.ok) {
      console.error("Failed to fetch assets:", resp.statusText);
      // Return default sample assets so dashboard still shows meaningful data
      return DEFAULT_ASSETS;
    }
    const raw = (await resp.json()) as any[]; // raw search results
    // If API returned no results, fall back to sample assets
    if (!raw || raw.length === 0) {
      console.warn("No assets returned from API — using DEFAULT_ASSETS for dashboard display.");
      return DEFAULT_ASSETS;
    }

    // apply your category rules here (use passed rules or defaultRules)
    const categorized = applyCategoryRules(raw, rules ?? defaultRules);
    return (categorized as Asset[]).length ? (categorized as Asset[]) : DEFAULT_ASSETS;
  } catch (err) {
    console.error("Error fetching assets:", err);
    // On network or other errors, fall back to sample data so the UI remains useful.
    return DEFAULT_ASSETS;
  }
};

const groupBy = (assets: Asset[], key: keyof Asset) => {
  return assets.reduce<Record<string, number>>((acc, asset) => {
    const value = (asset[key] as string) || "Unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Allow forcing sample data via Vite env var `VITE_FORCE_SAMPLE_DATA=true`
  // or by toggling the switch below in the UI while developing.
  const envForceSample = (import.meta.env?.VITE_FORCE_SAMPLE_DATA === "true");
  const [useSampleData, setUseSampleData] = useState<boolean>(() => {
    // Prefer a persisted user preference in localStorage when available.
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("useSampleData");
        if (stored !== null) return stored === "true";
      }
    } catch (err) {
      // ignore localStorage errors
    }
    return envForceSample;
  });

  // Persist toggle to localStorage so the developer preference survives refreshes
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("useSampleData", String(useSampleData));
      }
    } catch (err) {
      // ignore storage errors (e.g., private mode)
    }
  }, [useSampleData]);

  // read category rules from AppConfigContext, fall back to defaultRules
  const appConfig = useContext(AppConfigContext);
  // AppConfigContext type may not have categoryRules declared; use a safe cast
  // so TypeScript won't error while still allowing runtime lookup and fallback.
  const categoryRules: CategoryRule[] = (appConfig as any)?.categoryRules ?? defaultRules;

  useEffect(() => {
    // If dev/test wants sample data, skip API call and load defaults.
    if (useSampleData) {
      setAssets(DEFAULT_ASSETS);
      setLoading(false);
      return;
    }

    (async () => {
      const data = await fetchAssets(categoryRules);
      setAssets(data);
      setLoading(false);
    })();
    // JSON.stringify used to trigger effect when rules change
  }, [JSON.stringify(categoryRules), useSampleData]);

  const categories = Array.from(
    new Set(assets.map((a) => a.category || "Unknown"))
  );
  const filteredAssets =
    categoryFilter === "All"
      ? assets
      : assets.filter((a) => a.category === categoryFilter);

  const categoryData = groupBy(filteredAssets, "category");
  const campaignData = groupBy(filteredAssets, "campaign");
  const usageData = groupBy(filteredAssets, "usage");

  // Chart refs so we can explicitly destroy Chart.js instances before
  // remounting a new chart. This prevents "Canvas is already in use"
  // errors when React reuses the DOM canvas element.
  const categoryChartRef = useRef<any>(null);
  const campaignChartRef = useRef<any>(null);
  const usageChartRef = useRef<any>(null);

  useEffect(() => {
    const destroyIfExists = (r: any) => {
      if (!r || !r.current) return;
      const inst = r.current.chartInstance ?? r.current.chart;
      if (inst && typeof inst.destroy === "function") {
        try {
          inst.destroy();
        } catch (err) {
          // ignore destruction errors
        }
      }
    };

    // Destroy existing charts before new data mounts
    destroyIfExists(categoryChartRef);
    destroyIfExists(campaignChartRef);
    destroyIfExists(usageChartRef);
    // Re-run when the underlying data changes
  }, [JSON.stringify(categoryData), JSON.stringify(campaignData), JSON.stringify(usageData)]);

  if (loading)
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Asset Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Filter by Category</Typography>
              <Select
                fullWidth
                value={categoryFilter}
                onChange={(e: SelectChangeEvent) =>
                  setCategoryFilter(e.target.value as string)
                }
              >
                <MenuItem value="All">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useSampleData}
                      onChange={(e) => setUseSampleData(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Use sample data (dev)"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Optionally add summary cards here */}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assets by Category
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: Object.keys(categoryData),
                    datasets: [
                      {
                        label: "Assets",
                        data: Object.values(categoryData),
                        backgroundColor: "rgba(75,192,192,0.6)",
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                  ref={categoryChartRef}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assets by Campaign
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={{
                    labels: Object.keys(campaignData),
                    datasets: [
                      {
                        label: "Assets",
                        data: Object.values(campaignData),
                        backgroundColor: [
                          "rgba(255,99,132,0.6)",
                          "rgba(54,162,235,0.6)",
                          "rgba(255,206,86,0.6)",
                          "rgba(75,192,192,0.6)",
                        ],
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                  ref={campaignChartRef}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assets by Usage
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: Object.keys(usageData),
                    datasets: [
                      {
                        label: "Assets",
                        data: Object.values(usageData),
                        backgroundColor: "rgba(153,102,255,0.6)",
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                  ref={usageChartRef}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
