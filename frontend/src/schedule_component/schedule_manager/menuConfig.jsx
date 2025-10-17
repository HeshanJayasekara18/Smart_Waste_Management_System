// menuConfig.js
// Open/Closed Principle: Add new items without touching Sidebar component.
import { TrendingUp, Calendar, MapPin, Settings, Users, HelpCircle } from "lucide-react";

export default [
  { icon: TrendingUp, label: "Dashboard" },
  { icon: Calendar, label: "Schedules" },
  { icon: MapPin, label: "Routes" },
  { icon: TrendingUp, label: "Analytics" },
  { icon: Settings, label: "Settings" },
  { icon: Users, label: "Manage Accounts" },
  { icon: HelpCircle, label: "Help" },
];
