/**
 * routes/pincode.js
 * 
 * Pincode-based location identification API.
 * Uses the free api.postalpincode.in service to resolve Indian pincodes,
 * with a built-in fallback mock for development/demo use.
 * 
 * The lat/lng system is kept fully intact — pincode is an additional filter only.
 */

const express = require("express");
const router  = express.Router();

// In-memory cache so repeated lookups for same pincode don't re-fetch
const pincodeCache = new Map();

// Mock data for demo/offline use (covers common Indian pincodes)
const MOCK_PINCODES = {
  "600001": { district: "Chennai", state: "Tamil Nadu", offices: [
    { officename: "Chennai GPO", pincode: "600001", taluk: "Chennai", districtName: "Chennai", stateName: "Tamil Nadu", latitude: "13.0827", longitude: "80.2707" },
    { officename: "Anna Salai SO", pincode: "600001", taluk: "Chennai", districtName: "Chennai", stateName: "Tamil Nadu", latitude: "13.0621", longitude: "80.2503" },
  ]},
  "400001": { district: "Mumbai", state: "Maharashtra", offices: [
    { officename: "Mumbai GPO", pincode: "400001", taluk: "Mumbai", districtName: "Mumbai", stateName: "Maharashtra", latitude: "18.9387", longitude: "72.8353" },
    { officename: "Fort SO", pincode: "400001", taluk: "Mumbai", districtName: "Mumbai", stateName: "Maharashtra", latitude: "18.9322", longitude: "72.8355" },
  ]},
  "110001": { district: "New Delhi", state: "Delhi", offices: [
    { officename: "New Delhi GPO", pincode: "110001", taluk: "New Delhi", districtName: "New Delhi", stateName: "Delhi", latitude: "28.6139", longitude: "77.2090" },
    { officename: "Connaught Place SO", pincode: "110001", taluk: "New Delhi", districtName: "New Delhi", stateName: "Delhi", latitude: "28.6315", longitude: "77.2167" },
  ]},
  "560001": { district: "Bengaluru", state: "Karnataka", offices: [
    { officename: "Bangalore GPO", pincode: "560001", taluk: "Bangalore North", districtName: "Bengaluru", stateName: "Karnataka", latitude: "12.9716", longitude: "77.5946" },
    { officename: "MG Road SO", pincode: "560001", taluk: "Bangalore North", districtName: "Bengaluru", stateName: "Karnataka", latitude: "12.9757", longitude: "77.6073" },
  ]},
  "700001": { district: "Kolkata", state: "West Bengal", offices: [
    { officename: "Kolkata GPO", pincode: "700001", taluk: "Kolkata", districtName: "Kolkata", stateName: "West Bengal", latitude: "22.5726", longitude: "88.3639" },
    { officename: "BBD Bag SO", pincode: "700001", taluk: "Kolkata", districtName: "Kolkata", stateName: "West Bengal", latitude: "22.5697", longitude: "88.3487" },
  ]},
};

/**
 * GET /api/pincode/:pincode
 * Returns location details for a pincode including offices/streets.
 */
router.get("/:pincode", async (req, res) => {
  const { pincode } = req.params;

  // Validate pincode format (6-digit Indian pincode)
  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ error: "Pincode must be a 6-digit number" });
  }

  // Return from cache if available
  if (pincodeCache.has(pincode)) {
    return res.json(pincodeCache.get(pincode));
  }

  // Try mock data first for demo pincodes
  if (MOCK_PINCODES[pincode]) {
    const mock = MOCK_PINCODES[pincode];
    const result = {
      pincode,
      district: mock.district,
      state: mock.state,
      offices: mock.offices,
      source: "mock",
    };
    pincodeCache.set(pincode, result);
    return res.json(result);
  }

  // Attempt live lookup via India Post API
  try {
    const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await response.json();

    if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const offices = data[0].PostOffice;
      const result = {
        pincode,
        district: offices[0].District,
        state:    offices[0].State,
        offices:  offices.map(o => ({
          officename:   o.Name,
          pincode,
          taluk:        o.Taluk,
          districtName: o.District,
          stateName:    o.State,
          latitude:     null,
          longitude:    null,
        })),
        source: "live",
      };
      pincodeCache.set(pincode, result);
      return res.json(result);
    }

    return res.status(404).json({ error: "Pincode not found or invalid" });

  } catch (err) {
    // If live fetch fails, return a generated placeholder so the app still works
    const result = {
      pincode,
      district: `Area-${pincode.slice(0, 3)}`,
      state:    "India",
      offices: [
        {
          officename:   `${pincode} Post Office`,
          pincode,
          taluk:        `Taluk-${pincode.slice(0, 4)}`,
          districtName: `District-${pincode.slice(0, 3)}`,
          stateName:    "India",
          latitude:     null,
          longitude:    null,
        },
      ],
      source: "fallback",
    };
    pincodeCache.set(pincode, result);
    return res.json(result);
  }
});

/**
 * GET /api/pincode/:pincode/workers
 * Returns approved workers in the same pincode area.
 * This is an ADDITIONAL filter — the existing lat/lng system is still used for distance sorting.
 */
router.get("/:pincode/workers", (req, res) => {
  const { pincode } = req.params;
  const { category } = req.query;
  const fs   = require("fs");
  const path = require("path");

  const WORKERS_FILE = path.join(__dirname, "../data/workers.json");
  let workers = JSON.parse(fs.readFileSync(WORKERS_FILE, "utf-8"));

  // Filter: approved + same pincode
  workers = workers.filter(w => w.approved && w.pincode === pincode);

  if (category) {
    workers = workers.filter(w => w.categoryId === parseInt(category));
  }

  // Strip sensitive fields
  res.json(workers.map(w => {
    const { payoutAccount, ...safe } = w;
    return safe;
  }));
});

module.exports = router;
