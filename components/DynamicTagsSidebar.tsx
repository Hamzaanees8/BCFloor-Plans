"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  Users,
  Camera,
  Home,
  Calendar,
  Package,
  Receipt,
  Maximize2,
  AlertTriangle,
  Printer,
  Building,
  Link2,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DYNAMIC_TAG_CATEGORIES,
  groupAndFilterTags,
  getTagDescription,
} from "@/lib/dynamic-tags";

interface DynamicTagsSidebarProps {
  availableTags: string[];
  onTagClick: (tag: string) => void;
  getTagPreviewValue?: (tag: string) => { value?: string | null; hasValue: boolean };
  className?: string;
  title?: string;
  subtitle?: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  client_agent: Users,
  vendor_team: Camera,
  property: Home,
  scheduling: Calendar,
  orders_services: Package,
  billing: Receipt,
  floorplan: Maximize2,
  tour_cancellation: AlertTriangle,
  print: Printer,
  company: Building,
  links: Link2,
  other: Sparkles,
};

export default function DynamicTagsSidebar({
  availableTags,
  onTagClick,
  getTagPreviewValue,
  className = "",
  title = "Dynamic Tags",
  subtitle = "Click any tag to insert at cursor",
}: DynamicTagsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [allCollapsedState, setAllCollapsedState] = useState(false);

  // Group and filter tags based on search query and category filter
  const groupedSections = useMemo(() => {
    return groupAndFilterTags(availableTags, searchQuery, selectedCategory);
  }, [availableTags, searchQuery, selectedCategory]);

  const totalMatchingTags = useMemo(() => {
    return groupedSections.reduce((acc, sec) => acc + sec.tags.length, 0);
  }, [groupedSections]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const toggleExpandCollapseAll = () => {
    const nextState = !allCollapsedState;
    setAllCollapsedState(nextState);
    const updated: Record<string, boolean> = {};
    groupedSections.forEach((s) => {
      updated[s.id] = nextState;
    });
    setCollapsedCategories(updated);
  };

  const isCategoryCollapsed = (catId: string) => {
    // If there is an active search query, always keep matching categories open
    if (searchQuery.trim().length > 0) return false;
    // If a specific category filter is chosen, keep it open
    if (selectedCategory !== "all") return false;
    return !!collapsedCategories[catId];
  };

  return (
    <div
      className={`bg-white border border-[#DDDDDD] rounded-lg p-3 flex flex-col shadow-xs min-h-0 h-full overflow-hidden font-alexandria select-none ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#EEEEEE] shrink-0">
        <div>
          <span className="font-bold text-xs uppercase tracking-wider text-[#4290E9] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {title}
          </span>
          {subtitle && (
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight font-normal">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleExpandCollapseAll}
            className="text-[10px] text-gray-500 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-gray-100 flex items-center gap-1 transition-colors cursor-pointer"
            title={allCollapsedState ? "Expand all categories" : "Collapse all categories"}
          >
            <ChevronsUpDown className="w-3 h-3" />
            <span>{allCollapsedState ? "Expand" : "Collapse"}</span>
          </button>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
            {totalMatchingTags} tags
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-2 shrink-0">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags (e.g. name, date, phone)..."
          className="w-full text-[11px] bg-gray-50 hover:bg-gray-100/80 focus:bg-white pl-8 pr-7 py-1.5 rounded-md border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 outline-none transition-all placeholder:text-gray-400 text-gray-700"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 shrink-0 custom-scrollbar text-[10px]">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
            selectedCategory === "all"
              ? "bg-[#4290E9] text-white shadow-2xs font-semibold"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {DYNAMIC_TAG_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-[#4290E9] text-white shadow-2xs font-semibold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tags Grouped List - shrink-0 on items ensures natural height and forces scroll */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 custom-scrollbar">
        {groupedSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 my-auto">
            <Tag className="w-7 h-7 mb-2 text-gray-300 stroke-[1.5]" />
            <p className="text-xs font-semibold text-gray-600">
              No matching tags
            </p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              No dynamic tags match &quot;{searchQuery}&quot;. Try searching with a different term.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-3 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <TooltipProvider delayDuration={50}>
            {groupedSections.map((section) => {
              const Icon = CATEGORY_ICONS[section.id] || Sparkles;
              const isCollapsed = isCategoryCollapsed(section.id);

              return (
                <div
                  key={section.id}
                  className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-2xs shrink-0 flex flex-col"
                >
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategoryCollapse(section.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-gray-50/90 hover:bg-gray-100 text-left border-b border-gray-100 transition-colors cursor-pointer select-none shrink-0"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-[#4290E9] shrink-0" />
                      <span className="text-[11px] font-bold text-gray-800 truncate tracking-tight">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-semibold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {section.tags.length}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Category Tags Content */}
                  {!isCollapsed && (
                    <div className="p-2 flex flex-wrap gap-1.5 bg-white shrink-0">
                      {section.tags.map((tag) => {
                        const preview = getTagPreviewValue
                          ? getTagPreviewValue(tag)
                          : undefined;
                        const desc = getTagDescription(tag);
                        const fallbackTitle = preview?.hasValue
                          ? `${desc}\nValue: "${preview.value}"`
                          : desc;

                        return (
                          <Tooltip key={tag}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onTagClick(tag)}
                                title={fallbackTitle}
                                className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300 transition-all shadow-2xs select-none active:scale-95 text-left cursor-pointer"
                              >
                                <span className="font-medium tracking-tight">
                                  {tag}
                                </span>
                                {preview && preview.hasValue && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                                    title="Value available"
                                  />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              sideOffset={6}
                              className="max-w-[260px] text-xs font-sans p-2.5 z-[99999] bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 pointer-events-none"
                            >
                              <div className="font-mono font-bold text-[11px] text-blue-300 mb-1">
                                {tag}
                              </div>
                              <p className="text-[11px] text-gray-200 leading-relaxed font-normal">
                                {desc}
                              </p>
                              {preview && (
                                <div className="mt-2 pt-1.5 border-t border-gray-700/60 text-[10px]">
                                  <span className="text-gray-400 font-semibold">
                                    Resolved Value:
                                  </span>{" "}
                                  {preview.hasValue ? (
                                    <span className="text-emerald-300 font-medium font-mono">
                                      &quot;{preview.value}&quot;
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic font-mono">
                                      [Not Set / Empty]
                                    </span>
                                  )}
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
