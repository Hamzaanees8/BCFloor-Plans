/**
 * Tax Calculator for Vendor Invoices
 * Calculates appropriate tax rates based on vendor location (province/state)
 * No registration checks - all vendors are taxed according to their location
 */

interface TaxRateInfo {
  rate: number;
  taxType: string;
  country: string;
}

export interface TaxComponent {
  name: string;
  rate: number;
}

export interface TaxBreakdown {
  taxes: TaxComponent[];
  total_rate: number;
  location: {
    country: string;
    province: string;
  };
  is_taxable: boolean;
}

/**
 * Get tax rate by province/state
 * @param province - Province (Canada) or State (USA)
 * @param country - "Canada" or "USA"
 * @returns Tax rate percentage and tax type
 */
export function getTaxRateByLocation(
  province: string,
  country: string = "Canada"
): TaxRateInfo {
  const normalizedProvince = province?.toUpperCase().trim() || "";
  const normalizedCountry = country?.toUpperCase().trim() || "CANADA";

  // CANADA TAX RATES
  if (normalizedCountry === "CANADA") {
    switch (normalizedProvince) {
      // GST only provinces (5%)
      case "AB":
      case "ALBERTA":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      case "BC":
      case "BRITISH COLUMBIA":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      case "MB":
      case "MANITOBA":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      case "SK":
      case "SASKATCHEWAN":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      case "YT":
      case "YUKON":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      case "NT":
      case "NORTHWEST TERRITORIES":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      case "NU":
      case "NUNAVUT":
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };

      // HST provinces (13%)
      case "ON":
      case "ONTARIO":
        return { rate: 13.0, taxType: "HST (13%)", country: "Canada" };

      // HST 14-15% provinces
      case "NB":
      case "NEW BRUNSWICK":
        return { rate: 15.0, taxType: "HST (15%)", country: "Canada" };

      case "NL":
      case "NEWFOUNDLAND":
      case "NEWFOUNDLAND AND LABRADOR":
        return { rate: 15.0, taxType: "HST (15%)", country: "Canada" };

      case "NS":
      case "NOVA SCOTIA":
        return { rate: 15.0, taxType: "HST (15%)", country: "Canada" };

      case "PE":
      case "PEI":
      case "PRINCE EDWARD ISLAND":
        return { rate: 15.0, taxType: "HST (15%)", country: "Canada" };

      // Quebec (GST 5% + QST 9.975% = 14.975%, displayed as 14.975%)
      case "QC":
      case "QUEBEC":
        return { rate: 14.975, taxType: "GST (5%) + QST (9.975%)", country: "Canada" };

      default:
        return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };
    }
  }

  // USA TAX RATES (by state - base rates)
  if (normalizedCountry === "USA") {
    switch (normalizedProvince) {
      case "AL":
      case "ALABAMA":
        return { rate: 4.0, taxType: "Sales Tax (4%)", country: "USA" };

      case "AK":
      case "ALASKA":
        return { rate: 0.0, taxType: "No Sales Tax", country: "USA" };

      case "AZ":
      case "ARIZONA":
        return { rate: 5.6, taxType: "Sales Tax (5.6%)", country: "USA" };

      case "AR":
      case "ARKANSAS":
        return { rate: 6.5, taxType: "Sales Tax (6.5%)", country: "USA" };

      case "CA":
      case "CALIFORNIA":
        return { rate: 7.25, taxType: "Sales Tax (7.25%)", country: "USA" };

      case "CO":
      case "COLORADO":
        return { rate: 2.9, taxType: "Sales Tax (2.9%)", country: "USA" };

      case "CT":
      case "CONNECTICUT":
        return { rate: 6.35, taxType: "Sales Tax (6.35%)", country: "USA" };

      case "DE":
      case "DELAWARE":
        return { rate: 0.0, taxType: "No Sales Tax", country: "USA" };

      case "FL":
      case "FLORIDA":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "GA":
      case "GEORGIA":
        return { rate: 4.0, taxType: "Sales Tax (4%)", country: "USA" };

      case "HI":
      case "HAWAII":
        return { rate: 4.0, taxType: "Sales Tax (4%)", country: "USA" };

      case "ID":
      case "IDAHO":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "IL":
      case "ILLINOIS":
        return { rate: 6.25, taxType: "Sales Tax (6.25%)", country: "USA" };

      case "IN":
      case "INDIANA":
        return { rate: 7.0, taxType: "Sales Tax (7%)", country: "USA" };

      case "IA":
      case "IOWA":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "KS":
      case "KANSAS":
        return { rate: 6.5, taxType: "Sales Tax (6.5%)", country: "USA" };

      case "KY":
      case "KENTUCKY":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "LA":
      case "LOUISIANA":
        return { rate: 4.45, taxType: "Sales Tax (4.45%)", country: "USA" };

      case "ME":
      case "MAINE":
        return { rate: 5.5, taxType: "Sales Tax (5.5%)", country: "USA" };

      case "MD":
      case "MARYLAND":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "MA":
      case "MASSACHUSETTS":
        return { rate: 6.25, taxType: "Sales Tax (6.25%)", country: "USA" };

      case "MI":
      case "MICHIGAN":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "MN":
      case "MINNESOTA":
        return { rate: 6.875, taxType: "Sales Tax (6.875%)", country: "USA" };

      case "MS":
      case "MISSISSIPPI":
        return { rate: 7.0, taxType: "Sales Tax (7%)", country: "USA" };

      case "MO":
      case "MISSOURI":
        return { rate: 4.225, taxType: "Sales Tax (4.225%)", country: "USA" };

      case "MT":
      case "MONTANA":
        return { rate: 0.0, taxType: "No Sales Tax", country: "USA" };

      case "NE":
      case "NEBRASKA":
        return { rate: 5.5, taxType: "Sales Tax (5.5%)", country: "USA" };

      case "NV":
      case "NEVADA":
        return { rate: 6.85, taxType: "Sales Tax (6.85%)", country: "USA" };

      case "NH":
      case "NEW HAMPSHIRE":
        return { rate: 0.0, taxType: "No Sales Tax", country: "USA" };

      case "NJ":
      case "NEW JERSEY":
        return { rate: 6.625, taxType: "Sales Tax (6.625%)", country: "USA" };

      case "NM":
      case "NEW MEXICO":
        return { rate: 5.125, taxType: "Sales Tax (5.125%)", country: "USA" };

      case "NY":
      case "NEW YORK":
        return { rate: 4.0, taxType: "Sales Tax (4%)", country: "USA" };

      case "NC":
      case "NORTH CAROLINA":
        return { rate: 4.75, taxType: "Sales Tax (4.75%)", country: "USA" };

      case "ND":
      case "NORTH DAKOTA":
        return { rate: 5.0, taxType: "Sales Tax (5%)", country: "USA" };

      case "OH":
      case "OHIO":
        return { rate: 5.75, taxType: "Sales Tax (5.75%)", country: "USA" };

      case "OK":
      case "OKLAHOMA":
        return { rate: 4.5, taxType: "Sales Tax (4.5%)", country: "USA" };

      case "OR":
      case "OREGON":
        return { rate: 0.0, taxType: "No Sales Tax", country: "USA" };

      case "PA":
      case "PENNSYLVANIA":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "RI":
      case "RHODE ISLAND":
        return { rate: 7.0, taxType: "Sales Tax (7%)", country: "USA" };

      case "SC":
      case "SOUTH CAROLINA":
        return { rate: 7.5, taxType: "Sales Tax (7.5%)", country: "USA" };

      case "SD":
      case "SOUTH DAKOTA":
        return { rate: 4.2, taxType: "Sales Tax (4.2%)", country: "USA" };

      case "TN":
      case "TENNESSEE":
        return { rate: 7.0, taxType: "Sales Tax (7%)", country: "USA" };

      case "TX":
      case "TEXAS":
        return { rate: 6.25, taxType: "Sales Tax (6.25%)", country: "USA" };

      case "UT":
      case "UTAH":
        return { rate: 4.85, taxType: "Sales Tax (4.85%)", country: "USA" };

      case "VT":
      case "VERMONT":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "VA":
      case "VIRGINIA":
        return { rate: 5.75, taxType: "Sales Tax (5.75%)", country: "USA" };

      case "WA":
      case "WASHINGTON":
        return { rate: 6.5, taxType: "Sales Tax (6.5%)", country: "USA" };

      case "WV":
      case "WEST VIRGINIA":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      case "WI":
      case "WISCONSIN":
        return { rate: 5.0, taxType: "Sales Tax (5%)", country: "USA" };

      case "WY":
      case "WYOMING":
        return { rate: 4.0, taxType: "Sales Tax (4%)", country: "USA" };

      // DC
      case "DC":
      case "DISTRICT OF COLUMBIA":
        return { rate: 6.0, taxType: "Sales Tax (6%)", country: "USA" };

      default:
        return { rate: 5.0, taxType: "Sales Tax (5%)", country: "USA" };
    }
  }

  // Default fallback
  return { rate: 5.0, taxType: "GST (5%)", country: "Canada" };
}

/**
 * Get detailed tax breakdown by province/state
 * Supports multi-component taxes like Quebec (GST + QST)
 * @param province - Province (Canada) or State (USA)
 * @param country - "Canada" or "USA"
 * @returns Tax breakdown with individual components and total rate
 */
export function getTaxBreakdownByLocation(
  province: string,
  country: string = "Canada"
): TaxBreakdown {
  const normalizedCountry = country?.toUpperCase().trim() || "CANADA";
  const breakdown: TaxBreakdown = {
    taxes: [],
    total_rate: 0,
    location: {
      country: normalizedCountry === "USA" ? "USA" : "Canada",
      province: province || ""
    },
    is_taxable: true
  };

  // Base lookup
  const rateInfo = getTaxRateByLocation(province, country);
  breakdown.total_rate = rateInfo.rate;

  if (rateInfo.rate === 0) {
    breakdown.is_taxable = false;
    return breakdown;
  }

  // Parse components based on taxType string
  if (rateInfo.taxType.includes("+")) {
    // Multi-component (e.g. "GST (5%) + QST (9.975%)")
    const parts = rateInfo.taxType.split("+").map(p => p.trim());
    parts.forEach(part => {
      // Parse "NAME (RATE%)"
      const match = part.match(/(.+?)\s*\((\d+(?:\.\d+)?)%\)/);
      if (match) {
        breakdown.taxes.push({
          name: match[1].trim(),
          rate: parseFloat(match[2])
        });
      } else {
        breakdown.taxes.push({ name: part, rate: 0 }); // Fallback
      }
    });
  } else {
    // Single component
    const match = rateInfo.taxType.match(/(.+?)\s*\((\d+(?:\.\d+)?)%\)/);
    if (match) {
      breakdown.taxes.push({
        name: match[1].trim(),
        rate: parseFloat(match[2])
      });
    } else {
      breakdown.taxes.push({ name: rateInfo.taxType, rate: rateInfo.rate });
    }
  }

  return breakdown;
}

/**
 * Format tax rate for display
 */
export function formatTaxDisplay(rate: number, taxType: string): string {
  return taxType;
}
