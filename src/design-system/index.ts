/**
 * Okradesu design system: the app's own UI components, tokens and icons,
 * exported as one entry so Claude Design can build with the real parts.
 * Built for the web by `.design-sync/build-web.mjs` (react-native-web).
 */
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudRain,
  Droplet,
  Droplets,
  Fan,
  House,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  RadioTower,
  ScanLine,
  School,
  Search,
  Send,
  SlidersHorizontal,
  Sprout,
  Store,
  Sun,
  Thermometer,
  Tractor,
  TriangleAlert,
  Truck,
  Warehouse,
} from 'lucide-react-native';

// ── UI kit ─────────────────────────────────────────────────────────
export { Txt } from '@/components/ui/text';
export type { TxtProps, TextVariant } from '@/components/ui/text';
export { Button, IconButton } from '@/components/ui/button';
export type { ButtonProps, IconButtonProps } from '@/components/ui/button';
export { Badge } from '@/components/ui/badge';
export type { BadgeTone } from '@/components/ui/badge';
export { Card, Divider, IconWell, Meter } from '@/components/ui/surface';
export { InfoStat, ScreenTitle, SectionHeader } from '@/components/ui/section-header';
export { SearchField } from '@/components/ui/search-field';
export { Toggle } from '@/components/ui/toggle';
export { RenderPlaceholder } from '@/components/ui/render-placeholder';

// ── Okradesu pieces ────────────────────────────────────────────────
export { HarvestGrid, UpcomingChart } from '@/components/harvest-map';
export { ForecastChart, LegendSwatch } from '@/components/forecast-chart';
export { MaturityBadge } from '@/components/maturity-badge';
export { TodayPlan } from '@/components/monitor/today-plan';
export type { Task } from '@/components/monitor/today-plan';
export { OkraFlower, OkraPod, RowSnapshot } from '@/components/illustrations';
export type { PodTone } from '@/components/illustrations';

// ── Tokens ─────────────────────────────────────────────────────────
export { Colors, Fonts, MaxContentWidth, Palette, Radius, Shadow, Spacing, TextSize } from '@/constants/theme';

// ── Sample data (the demo farm), for realistic compositions ────────
export { allRows, harvestPlan, planTotals, upcomingPods } from '@/data/harvest';
export type { PlanRow } from '@/data/harvest';
export { FARMS } from '@/data/farms';
export type { Farm } from '@/data/farms';

/** Lucide icons used across the app. Pass one as a component's `icon` prop, or render `<Icons.Sprout size={18} />`. */
export const Icons = {
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudRain,
  Droplet,
  Droplets,
  Fan,
  House,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  RadioTower,
  ScanLine,
  School,
  Search,
  Send,
  SlidersHorizontal,
  Sprout,
  Store,
  Sun,
  Thermometer,
  Tractor,
  TriangleAlert,
  Truck,
  Warehouse,
};
