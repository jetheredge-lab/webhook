import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export const EquityCalendar = () => {
    // Basic wrapper mimicking the heatmap
    const [events, setEvents] = useState([
        { title: '+$450', start: new Date(), end: new Date(), pnl: 450, trades: 4 }
    ]);

    const eventPropGetter = (event: any) => {
        const bg = event.pnl > 0 ? '#10B981' : event.pnl < 0 ? '#EF4444' : '#94A3B8';
        return { style: { backgroundColor: bg, border: 'none', borderRadius: '4px', opacity: 0.9 } };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Equity Heatmap</h2>
                <p className="text-muted mt-2 font-mono text-sm">Visualizing execution profitability historically.</p>
            </header>

            <section className="glass-card min-h-[600px] font-sans">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    eventPropGetter={eventPropGetter}
                    views={['month']}
                />
            </section>
        </div>
    );
};
