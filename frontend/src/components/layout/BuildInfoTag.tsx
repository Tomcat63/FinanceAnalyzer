"use client";

import React from "react";
import { version } from "../../../package.json";

export function BuildInfoTag() {
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "Development";

    return (
        <div className="fixed bottom-2 right-2 text-[10px] text-zinc-400/50 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors pointer-events-none font-medium z-50 select-none">
            v{version} | {buildId}
        </div>
    );
}
