export interface TagCategory {
  id: string;
  label: string;
  iconName?: string;
  description?: string;
  keywords?: string[];
  tags: string[];
}

export const DYNAMIC_TAG_DESCRIPTIONS: Record<string, string> = {
  // Recipient / Agent
  recipient_name: "Full name of the email recipient (agent, vendor, or admin).",
  agent_name: "Full name of the listing agent on the order.",
  agent_email: "Email address of the listing agent.",
  agent_phone: "Primary phone number of the listing agent.",
  user_name: "Name of the user or recipient.",
  name: "Name of the recipient.",
  email: "Email address of the recipient.",
  payer_name: "Name of the person who submitted the payment.",

  // Vendor / Field Team
  vendor_name: "Full name of the assigned vendor / photographer.",
  vendor_number: "Phone number of the assigned vendor.",
  vendor_phone: "Phone number of the assigned vendor.",
  vendor_email: "Email address of the assigned vendor.",
  completed_by: "Name of the vendor or team member who completed the service.",
  uploaded_by: "Name of the person or team who uploaded the media.",

  // Property / Location
  property_address: "Street address of the property / listing.",
  listing_address: "Street address of the property / listing.",
  property_location: "City / region of the property.",
  listing_location: "City / region of the property.",

  // Scheduling & Dates
  schedule_date: "Scheduled appointment date.",
  appointment_date: "Scheduled appointment date.",
  date: "Scheduled appointment date.",
  schedule_time: "Scheduled appointment start time.",
  appointment_time: "Scheduled appointment start time.",
  start_time: "Scheduled appointment start time.",
  end_time: "Scheduled appointment end time.",
  new_date: "New appointment date after a reschedule.",
  new_time: "New appointment time after a reschedule.",
  old_date: "Previous appointment date before a reschedule.",
  old_time: "Previous appointment time before a reschedule.",
  scheduled_appointments: "Formatted list of all scheduled appointment slots on the order.",

  // Orders & Services
  order_id: "Unique order reference ID.",
  service_name: "Name of the ordered service or appointment.",
  service_url: "Direct link to view the service or media.",
  media_count: "Number of media files (photos/videos/files) uploaded.",
  custom_message: "Custom message entered when sending the email.",
  changes_summary: "Summary of what changed in the updated order or schedule.",

  // Floor Plan Details
  floorplan_areas: "Requested floor plan areas to measure (e.g., Garage, Deck).",
  floorplan_notes: "Special instructions for floor plan measurements.",
  floorplan_section: "Formatted floor plan measurement details block.",

  // Billing & Invoices
  amount: "Total order or payment amount.",
  payment_for: "Description of what the payment covers.",
  payment_scope: "Scope of the payment (e.g., Full Order Invoice or specific service).",
  payment_method: "Payment method used (e.g., Credit Card).",
  payment_date: "Date and time when the payment was processed.",
  payment_id: "Unique payment transaction ID.",
  transfer_id: "Vendor payout / transfer reference ID.",
  invoice_number: "Invoice number associated with the order or payment.",
  invoice_id: "Internal invoice ID.",
  receipt_url: "Direct link to view or download the payment receipt.",
  cancellation_fee: "Cancellation fee amount applied, if any.",

  // 3D Tour & Cancellations
  cancellation_reason: "Reason provided for cancelling the order or slot.",
  expiry_date: "Current expiration date of the Matterport / 3D tour.",
  new_expiry_date: "Updated expiration date after tour renewal.",
  duration_months: "Number of months the tour was renewed for.",
  days_remaining: "Days remaining until the 3D tour expires.",
  renewal_url: "Direct link to renew the expiring 3D tour.",

  // Print Requests
  copies: "Number of printed copies requested.",
  with_bleed: "Whether the print request includes bleed.",
  additional_info: "Extra instructions or notes provided on the print request.",
  pdf_url: "Direct link to the printable PDF file.",

  // Company / Organization
  company_name: "Your organization / company name.",
  company_email: "Your organization's contact email address.",
  company_phone: "Your organization's contact phone number.",
  organization_name: "Name of the organization.",

  // Links & Navigation
  action_url: "Direct action button link URL.",
  portal_url: "Client portal URL.",
  reset_link: "Password reset link for account recovery.",
  url: "Action or reset link URL.",
};

export function getTagDescription(tag: string): string {
  const key = tag.replace(/^\{\{\s*|\s*\}\}$/g, "").toLowerCase();
  return (
    DYNAMIC_TAG_DESCRIPTIONS[key] ||
    `Dynamic placeholder for ${key.replace(/_/g, " ")}.`
  );
}

export const DYNAMIC_TAG_CATEGORIES: TagCategory[] = [
  {
    id: "client_agent",
    label: "Client & Agent",
    description: "Recipient, client, and listing agent contact details",
    keywords: ["agent", "client", "customer", "recipient", "user", "name", "email", "phone"],
    tags: [
      "{{recipient_name}}",
      "{{agent_name}}",
      "{{agent_email}}",
      "{{agent_phone}}",
      "{{user_name}}",
      "{{name}}",
      "{{email}}",
      "{{payer_name}}",
    ],
  },
  {
    id: "vendor_team",
    label: "Vendor & Field Team",
    description: "Assigned vendor, photographer, and technician information",
    keywords: ["vendor", "photographer", "tech", "field", "team", "contractor"],
    tags: [
      "{{vendor_name}}",
      "{{vendor_phone}}",
      "{{vendor_number}}",
      "{{vendor_email}}",
      "{{completed_by}}",
      "{{uploaded_by}}",
    ],
  },
  {
    id: "property",
    label: "Property & Location",
    description: "Listing address, city, and location details",
    keywords: ["property", "listing", "address", "location", "city", "street"],
    tags: [
      "{{property_address}}",
      "{{property_location}}",
      "{{listing_address}}",
      "{{listing_location}}",
    ],
  },
  {
    id: "scheduling",
    label: "Appointments & Schedule",
    description: "Dates, start/end times, and reschedule details",
    keywords: ["schedule", "appointment", "date", "time", "reschedule", "slot", "calendar"],
    tags: [
      "{{schedule_date}}",
      "{{schedule_time}}",
      "{{appointment_date}}",
      "{{appointment_time}}",
      "{{start_time}}",
      "{{end_time}}",
      "{{date}}",
      "{{new_date}}",
      "{{new_time}}",
      "{{old_date}}",
      "{{old_time}}",
      "{{scheduled_appointments}}",
    ],
  },
  {
    id: "orders_services",
    label: "Orders & Services",
    description: "Order references, service details, and media counts",
    keywords: ["order", "service", "media", "changes", "message"],
    tags: [
      "{{order_id}}",
      "{{service_name}}",
      "{{service_url}}",
      "{{changes_summary}}",
      "{{custom_message}}",
      "{{media_count}}",
    ],
  },
  {
    id: "billing",
    label: "Billing & Invoices",
    description: "Payments, fees, receipts, and invoice records",
    keywords: ["payment", "billing", "invoice", "receipt", "amount", "cost", "price", "fee", "transfer"],
    tags: [
      "{{amount}}",
      "{{payment_for}}",
      "{{payment_scope}}",
      "{{payment_method}}",
      "{{payment_date}}",
      "{{payment_id}}",
      "{{transfer_id}}",
      "{{invoice_number}}",
      "{{invoice_id}}",
      "{{receipt_url}}",
      "{{cancellation_fee}}",
    ],
  },
  {
    id: "floorplan",
    label: "Floor Plans",
    description: "Floor plan areas, measurements, and special instructions",
    keywords: ["floorplan", "floor plan", "area", "measure", "notes"],
    tags: [
      "{{floorplan_areas}}",
      "{{floorplan_notes}}",
      "{{floorplan_section}}",
    ],
  },
  {
    id: "tour_cancellation",
    label: "3D Tour & Cancellations",
    description: "Cancellation reasons, Matterport renewal, and expiration dates",
    keywords: ["cancel", "cancellation", "reason", "tour", "matterport", "expiry", "renew", "duration"],
    tags: [
      "{{cancellation_reason}}",
      "{{expiry_date}}",
      "{{new_expiry_date}}",
      "{{duration_months}}",
      "{{days_remaining}}",
      "{{renewal_url}}",
    ],
  },
  {
    id: "print",
    label: "Print Requests",
    description: "Print quantity, bleed options, and printable PDF links",
    keywords: ["print", "flyer", "feature sheet", "copies", "bleed", "pdf"],
    tags: [
      "{{copies}}",
      "{{with_bleed}}",
      "{{additional_info}}",
      "{{pdf_url}}",
    ],
  },
  {
    id: "company",
    label: "Company / Organization",
    description: "Business identity and organization contact info",
    keywords: ["company", "organization", "business", "brand", "support"],
    tags: [
      "{{company_name}}",
      "{{company_email}}",
      "{{company_phone}}",
      "{{organization_name}}",
    ],
  },
  {
    id: "links",
    label: "Links & Navigation",
    description: "Action buttons, portal access, and direct links",
    keywords: ["link", "url", "action", "portal", "button", "reset"],
    tags: [
      "{{action_url}}",
      "{{portal_url}}",
      "{{reset_link}}",
      "{{url}}",
    ],
  },
];

// Flat list of all default dynamic tags across categories
export const DEFAULT_DYNAMIC_TAGS: string[] = Array.from(
  new Set(DYNAMIC_TAG_CATEGORIES.flatMap((c) => c.tags))
);

// Helper to determine the best category for an event-specific variable
export function categorizeTag(tag: string): string {
  const cleanTag = tag.startsWith("{{") ? tag : `{{${tag}}}`;
  const key = cleanTag.replace(/^\{\{\s*|\s*\}\}$/g, "").toLowerCase();

  for (const cat of DYNAMIC_TAG_CATEGORIES) {
    if (cat.tags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
      return cat.id;
    }
  }

  // Keyword heuristic for dynamic variables
  if (/agent|client|customer|payer|user|guest/.test(key)) return "client_agent";
  if (/vendor|photographer|tech|creator|crew/.test(key)) return "vendor_team";
  if (/property|listing|address|unit|suite|city|postal|zip/.test(key)) return "property";
  if (/date|time|slot|schedule|appointment|reschedule/.test(key)) return "scheduling";
  if (/order|service|media|package|job/.test(key)) return "orders_services";
  if (/pay|invoice|receipt|amount|price|cost|tax|fee|refund|balance/.test(key)) return "billing";
  if (/floorplan|dimension|measurement|sqft/.test(key)) return "floorplan";
  if (/tour|matterport|expiry|renew|cancel/.test(key)) return "tour_cancellation";
  if (/print|copy|copies|bleed|flyer|brochure/.test(key)) return "print";
  if (/company|org|agency|brokerage|brand/.test(key)) return "company";
  if (/url|link|href|portal|action/.test(key)) return "links";

  return "other";
}

export interface GroupedTagSection {
  id: string;
  label: string;
  description?: string;
  tags: string[];
}

/**
 * Filter and group tags according to search query and optional category filter.
 */
export function groupAndFilterTags(
  availableTags: string[],
  searchQuery: string = "",
  selectedCategoryId: string = "all"
): GroupedTagSection[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Deduplicate and ensure {{...}} formatting
  const formattedTags = Array.from(
    new Set(availableTags.map((t) => (t.startsWith("{{") ? t : `{{${t}}}`)))
  );

  // Group tags into buckets
  const categoryMap = new Map<string, string[]>();
  for (const cat of DYNAMIC_TAG_CATEGORIES) {
    categoryMap.set(cat.id, []);
  }
  categoryMap.set("other", []);

  for (const tag of formattedTags) {
    const catId = categorizeTag(tag);
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, []);
    }
    categoryMap.get(catId)!.push(tag);
  }

  const results: GroupedTagSection[] = [];

  for (const cat of DYNAMIC_TAG_CATEGORIES) {
    if (selectedCategoryId !== "all" && selectedCategoryId !== cat.id) {
      continue;
    }

    const tagsInCat = categoryMap.get(cat.id) || [];
    const matchingTags = tagsInCat.filter((tag) => {
      if (!normalizedQuery) return true;

      const key = tag.replace(/^\{\{\s*|\s*\}\}$/g, "").toLowerCase();
      const desc = (DYNAMIC_TAG_DESCRIPTIONS[key] || "").toLowerCase();
      const catLabel = cat.label.toLowerCase();
      const keywords = (cat.keywords || []).join(" ").toLowerCase();

      // Check if tag name, clean key, description, category label, or category keywords match search
      return (
        tag.toLowerCase().includes(normalizedQuery) ||
        key.includes(normalizedQuery) ||
        desc.includes(normalizedQuery) ||
        catLabel.includes(normalizedQuery) ||
        keywords.includes(normalizedQuery)
      );
    });

    if (matchingTags.length > 0) {
      results.push({
        id: cat.id,
        label: cat.label,
        description: cat.description,
        tags: matchingTags,
      });
    }
  }

  // Handle "other" / dynamically unmapped category
  if (selectedCategoryId === "all" || selectedCategoryId === "other") {
    const otherTags = categoryMap.get("other") || [];
    const matchingOther = otherTags.filter((tag) => {
      if (!normalizedQuery) return true;
      const key = tag.replace(/^\{\{\s*|\s*\}\}$/g, "").toLowerCase();
      const desc = (DYNAMIC_TAG_DESCRIPTIONS[key] || "").toLowerCase();
      return (
        tag.toLowerCase().includes(normalizedQuery) ||
        key.includes(normalizedQuery) ||
        desc.includes(normalizedQuery)
      );
    });

    if (matchingOther.length > 0) {
      results.push({
        id: "other",
        label: "Additional & Custom Tags",
        description: "Dynamic variables specific to this event or template",
        tags: matchingOther,
      });
    }
  }

  return results;
}
