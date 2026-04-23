import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarDays, Plus, Trash2, MapPin, Bell, FileText } from "lucide-react";

const TYPE_COLORS = { market: 'bg-orange-500/10 text-orange-500', event: 'bg-blue-500/10 text-blue-500', note: 'bg-zinc-700 text-zinc-300' };

export const DashboardCalendar = () => {
  const [events, setEvents] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", notes: "", event_type: "market" });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/calendar/events`);
      setEvents(res.data);
    } catch (_e) { console.warn('Failed to load calendar events'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only module-level imports (API, axios) and stable state setters used
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const addEvent = async () => {
    if (!form.title || !form.date) { toast.error("Title and date required"); return; }
    try {
      await axios.post(`${API}/calendar/events`, form);
      toast.success("Event added");
      setAddOpen(false);
      setForm({ title: "", date: "", notes: "", event_type: "market" });
      fetchEvents();
    } catch (_e) { toast.error("Failed to add event"); }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API}/calendar/events/${id}`);
      fetchEvents();
    } catch (_e) { toast.error("Failed to delete"); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter(e => e.date >= today).slice(0, 8);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading text-zinc-50 flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-orange-500" /> Upcoming Events</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)} className="text-zinc-400 hover:text-zinc-200 h-8" data-testid="add-event-btn">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No upcoming events — add one!</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 group">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge className={`text-xs ${TYPE_COLORS[e.event_type] || TYPE_COLORS.note}`}>
                    {e.event_type === 'market' && <MapPin className="w-3 h-3 mr-1" />}
                    {e.event_type === 'event' && <Bell className="w-3 h-3 mr-1" />}
                    {e.event_type !== 'market' && e.event_type !== 'event' && <FileText className="w-3 h-3 mr-1" />}
                    {e.date?.slice(5).replace('-', '/')}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{e.title}</p>
                    {e.notes && <p className="text-xs text-zinc-500 truncate">{e.notes}</p>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteEvent(e.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader><DialogTitle className="text-zinc-50 font-heading">Add Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Market day, event..." data-testid="event-title-input" />
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-zinc-800 border-zinc-700" data-testid="event-date-input" />
            <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Notes (optional)" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 border-zinc-700">Cancel</Button>
              <Button onClick={addEvent} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="save-event-btn">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
