"use client";

import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { IsoDate } from "@/lib/nutrition/food-entry";

/**
 * Where a day lives. Today is the root route rather than its own dated URL, so
 * the address a user keeps open stays the day they are on rather than the day
 * they opened it — the same reason the root route names today itself.
 */
function href(date: IsoDate, today: IsoDate): string {
  return date === today ? "/" : `/${date}`;
}

export type DayNavigationProps = {
  /** The days there are to go to, newest first, as the read seam ordered them. */
  dates: IsoDate[];
  /** The day currently on screen, marked in the list. */
  viewing: IsoDate;
  /**
   * The day the server is on. Supplied rather than worked out: nothing below
   * the read seam reads a clock, and a list that guessed would name the wrong
   * row "Today" for anyone whose browser disagrees with the server.
   */
  today: IsoDate;
};

/**
 * The days that have been tracked, newest first, so a past day can be found
 * without remembering its date. Off-canvas behind a trigger on a phone, fixed
 * on a desktop — the shadcn sidebar's own behaviour, not a drawer of our own.
 *
 * The list arrives whole. There is no pagination and no virtualisation: a year
 * of tracking is on the order of 365 rows, which is a list, not a dataset.
 */
export function DayNavigation({ dates, viewing, today }: DayNavigationProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Days</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dates.map((date) => (
                <SidebarMenuItem key={date}>
                  <SidebarMenuButton
                    isActive={date === viewing}
                    render={
                      <Link
                        href={href(date, today)}
                        aria-current={date === viewing ? "page" : undefined}
                        // On a phone the sidebar is a sheet over the
                        // conversation it navigates to; leaving it open would
                        // hide the day just chosen.
                        onClick={() => setOpenMobile(false)}
                      >
                        {/* Today is named, not dated: finding where you are
                            should not take date arithmetic. */}
                        <span className="tabular-nums">
                          {date === today ? "Today" : date}
                        </span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
