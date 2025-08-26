import { useState } from "react";

export default function ToggleButtons() {
    const [active, setActive] = useState("details");

    return (
        <div className="flex gap-2">
            <button
                onClick={() => setActive("details")}
                className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
          ${active === "details" ? "bg-[#4290E9] text-white" : "bg-[#E4E4E4] text-[#666666]"}`}
            >
                DETAILS
            </button>
            {/* <button
                onClick={() => setActive("history")}
                className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
          ${active === "history" ? "bg-[#4290E9] text-white" : "bg-[#E4E4E4] text-[#666666]"}`}
            >
                HISTORY
            </button> */}
        </div>
    );
}
