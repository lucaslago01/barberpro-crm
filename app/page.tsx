'use client'

import { useState } from 'react'
import { AppShell } from "@/components/dashboard/app-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { Agenda } from "@/components/dashboard/agenda"
import { MiniCalendar } from "@/components/dashboard/mini-calendar"
import { Birthdays } from "@/components/dashboard/birthdays"
import { RecoverClients } from "@/components/dashboard/recover-clients"
import { Performance } from "@/components/dashboard/performance"
import { FeaturedClients } from "@/components/dashboard/featured-clients"

export default function Page() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  return (
    <AppShell>
      <div className="space-y-5">
        <KpiCards />

        {/* Main two-column grid */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
          {/* Left column */}
          <div className="space-y-5">
            <Agenda date={selectedDate} onDateChange={setSelectedDate} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Performance />
              <FeaturedClients />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <Birthdays />
            <RecoverClients />
          </div>
        </div>
      </div>
    </AppShell>
  )
}