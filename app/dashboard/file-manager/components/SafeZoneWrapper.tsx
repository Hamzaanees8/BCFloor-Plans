import React from "react";

export interface SafeZoneWrapperProps {
  children: React.ReactNode;
  showGuide?: boolean;
  showBleed?: boolean;
  safePaddingInches?: number;
  bleedPaddingInches?: number;
  className?: string;
}

export const SafeZoneWrapper: React.FC<SafeZoneWrapperProps> = ({
  children,
  showGuide = true,
  showBleed = true,
  safePaddingInches = 0.25,
  bleedPaddingInches = 0.125,
  className = "",
}) => {
  return (
    /* 1. Outermost container with 0.125" bleed padding */
    <div
      className={`relative w-full h-full box-border ${className}`}
      style={{ padding: showBleed ? `${bleedPaddingInches}in` : "0in" }}
    >
      {/* Outer Bleed Container wrapper */}
      <div className="relative w-full h-full box-border">
        {/* Red Bleed Border Guide (0.125" / 3mm outward boundary) */}
        {showGuide && showBleed && (
          <div
            data-html2canvas-ignore="true"
            className="absolute inset-0 border-2 border-dashed border-red-500 pointer-events-none select-none z-40"
          >
            <span className="absolute top-[-15px] rounded-t-[4px] left-0 -mb-[1px] bg-red-600 text-white font-bold text-[8.5px] tracking-wider uppercase px-2 py-0.5 shadow-sm z-50">
              Bleed Border ({bleedPaddingInches}&quot; / 3mm)
            </span>
          </div>
        )}

        {/* 2. Safe Zone Container with 0.25" padding inside the Red Bleed Border */}
        <div
          className="relative w-full h-full box-border"
          style={{ padding: `${safePaddingInches}in` }}
        >
          {/* Inner Safe Zone Container wrapper */}
          <div className="relative w-full h-full box-border">
            {/* Green Safe Zone Border Guide (0.25" inset boundary) */}
            {showGuide && (
              <div
                data-html2canvas-ignore="true"
                className="absolute inset-0 border-2 border-dashed border-emerald-500 pointer-events-none select-none z-40"
              >
                <span className="absolute bottom-full right-0 -mb-[1px] bg-emerald-600 text-white font-bold text-[8.5px] tracking-wider uppercase px-2 py-0.5 rounded-t shadow-sm z-50">
                  Safe Zone ({safePaddingInches}&quot; Inset)
                </span>
              </div>
            )}

            {/* 3. Actual Content Container */}
            <div className="relative w-full h-full z-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeZoneWrapper;
