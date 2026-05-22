/**
 * BATCH TRAVEL CALCULATOR
 * Optimized version that reduces Google Maps API calls from N to 1
 * 
 * PROBLEM: Calling calculateDistance() in a loop = N API calls
 * SOLUTION: Batch all distances in ONE DistanceMatrix call
 * 
 * Example:
 * - 3 orders → 4 legs (Vendor → Order1 → Order2 → Order3 → Vendor)
 * - OLD: 4 API calls (one per leg)
 * - NEW: 1 API call (all legs at once)
 */

export interface TravelLeg {
  from: string;        // origin address
  to: string;          // destination address
  legIndex: number;    // order in trip sequence (0, 1, 2...)
}

export interface LegResult {
  legIndex: number;
  distance: number;    // km
  duration: number;    // minutes
  status: string;
  from: string;
  to: string;
}

export interface BatchTravelResult {
  status: "OK" | "PARTIAL_FAILURE" | "ERROR";
  legs: LegResult[];
  totalDistance: number;
  totalDuration: number;
  failedLegs: LegResult[];
}

/**
 * Calculate all travel legs in a SINGLE batch API call
 * Reduces API quota usage dramatically
 * 
 * @param legs Array of trip legs to calculate
 * @returns Batch result with all distances
 */
export async function batchCalculateTravelCosts(
  legs: TravelLeg[]
): Promise<BatchTravelResult> {
  if (typeof window === "undefined" || !window.google?.maps) {
    console.warn("Google Maps API not loaded.");
    return {
      status: "ERROR",
      legs: [],
      totalDistance: 0,
      totalDuration: 0,
      failedLegs: legs.map((l) => ({
        legIndex: l.legIndex,
        distance: 0,
        duration: 0,
        status: "GOOGLE_MAPS_UNAVAILABLE",
        from: l.from,
        to: l.to,
      })),
    };
  }

  if (legs.length === 0) {
    return {
      status: "OK",
      legs: [],
      totalDistance: 0,
      totalDuration: 0,
      failedLegs: [],
    };
  }

  const distanceService = new window.google.maps.DistanceMatrixService();

  return new Promise((resolve) => {
    try {
      // Extract unique addresses to minimize payload
      const uniqueAddresses = new Set<string>();
      legs.forEach((leg) => {
        uniqueAddresses.add(leg.from.trim());
        uniqueAddresses.add(leg.to.trim());
      });

      // Build origins and destinations arrays
      // For trip chain: [Vendor, Job1, Job2, Job3]
      const origins: string[] = [];
      const destinations: string[] = [];

      legs.forEach((leg) => {
        if (!origins.includes(leg.from)) origins.push(leg.from);
        if (!destinations.includes(leg.to)) destinations.push(leg.to);
      });

      console.log(
        `📍 Batch calculating ${legs.length} legs in 1 API call`,
        `Origins: ${origins.length}, Destinations: ${destinations.length}`
      );

      distanceService.getDistanceMatrix(
        {
          origins: origins.map((o) => o.trim()),
          destinations: destinations.map((d) => d.trim()),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status !== "OK") {
            console.error("❌ Batch Distance Matrix failed:", status);
            const failedLegs = legs.map((leg) => ({
              legIndex: leg.legIndex,
              distance: 0,
              duration: 0,
              status,
              from: leg.from,
              to: leg.to,
            }));

            resolve({
              status: "ERROR",
              legs: [],
              totalDistance: 0,
              totalDuration: 0,
              failedLegs,
            });
            return;
          }

          if (!response?.rows) {
            console.error("❌ No rows in distance matrix response");
            const failedLegs = legs.map((leg) => ({
              legIndex: leg.legIndex,
              distance: 0,
              duration: 0,
              status: "NO_RESPONSE",
              from: leg.from,
              to: leg.to,
            }));

            resolve({
              status: "ERROR",
              legs: [],
              totalDistance: 0,
              totalDuration: 0,
              failedLegs,
            });
            return;
          }

          // Extract results for each leg
          const results: LegResult[] = [];
          const failedLegs: LegResult[] = [];
          let totalDistance = 0;
          let totalDuration = 0;

          legs.forEach((leg) => {
            const originIndex = origins.findIndex(
              (o) => o.trim() === leg.from.trim()
            );
            const destIndex = destinations.findIndex(
              (d) => d.trim() === leg.to.trim()
            );

            if (originIndex === -1 || destIndex === -1) {
              failedLegs.push({
                legIndex: leg.legIndex,
                distance: 0,
                duration: 0,
                status: "INDEX_MISMATCH",
                from: leg.from,
                to: leg.to,
              });
              return;
            }

            const element = response.rows[originIndex]?.elements?.[destIndex];

            if (!element || element.status !== "OK") {
              failedLegs.push({
                legIndex: leg.legIndex,
                distance: 0,
                duration: 0,
                status: element?.status || "NO_ELEMENT",
                from: leg.from,
                to: leg.to,
              });
              return;
            }

            const distance = element.distance.value / 1000; // meters to km
            const duration = element.duration.value / 60; // seconds to minutes

            results.push({
              legIndex: leg.legIndex,
              distance,
              duration,
              status: "OK",
              from: leg.from,
              to: leg.to,
            });

            totalDistance += distance;
            totalDuration += duration;
          });

          const hasFailures = failedLegs.length > 0;

          console.log(
            `✅ Batch complete: ${results.length}/${legs.length} legs calculated`,
            `Total: ${totalDistance.toFixed(2)}km, ${totalDuration.toFixed(0)}min`
          );

          if (hasFailures) {
            console.warn(
              `⚠️  ${failedLegs.length} legs failed:`,
              failedLegs.map((fl) => `${fl.from} → ${fl.to}: ${fl.status}`)
            );
          }

          resolve({
            status: hasFailures
              ? failedLegs.length === legs.length
                ? "ERROR"
                : "PARTIAL_FAILURE"
              : "OK",
            legs: results,
            totalDistance,
            totalDuration,
            failedLegs,
          });
        }
      );
    } catch (error) {
      console.error("❌ Exception in batchCalculateTravelCosts:", error);
      const failedLegs = legs.map((leg) => ({
        legIndex: leg.legIndex,
        distance: 0,
        duration: 0,
        status: "EXCEPTION",
        from: leg.from,
        to: leg.to,
      }));

      resolve({
        status: "ERROR",
        legs: [],
        totalDistance: 0,
        totalDuration: 0,
        failedLegs,
      });
    }
  });
}

/**
 * Helper: Build trip chain legs from orders
 * 
 * @example
 * buildTripChainLegs(
 *   "123 Main St",
 *   ["Order1 Address", "Order2 Address", "Order3 Address"]
 * )
 * // Returns:
 * // [
 * //   { from: "123 Main St", to: "Order1 Address", legIndex: 0 },
 * //   { from: "Order1 Address", to: "Order2 Address", legIndex: 1 },
 * //   { from: "Order2 Address", to: "Order3 Address", legIndex: 2 },
 * //   { from: "Order3 Address", to: "123 Main St", legIndex: 3 },
 * // ]
 */
export function buildTripChainLegs(
  vendorStartLocation: string,
  orderLocations: string[]
): TravelLeg[] {
  const legs: TravelLeg[] = [];
  let currentLocation = vendorStartLocation;
  let index = 0;

  // Vendor → Each order (in sequence)
  for (const orderLocation of orderLocations) {
    legs.push({
      from: currentLocation,
      to: orderLocation,
      legIndex: index++,
    });
    currentLocation = orderLocation;
  }

  // Return to vendor
  legs.push({
    from: currentLocation,
    to: vendorStartLocation,
    legIndex: index,
  });

  return legs;
}

/**
 * Helper: Calculate travel cost from batch result
 */
export function calculateTravelCostFromBatch(
  batchResult: BatchTravelResult,
  paymentPerKm: number
): { cost: number; distance: number; failureCount: number } {
  return {
    cost: batchResult.totalDistance * paymentPerKm,
    distance: batchResult.totalDistance,
    failureCount: batchResult.failedLegs.length,
  };
}
