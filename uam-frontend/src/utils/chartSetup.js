/**
 * Central Chart.js registration — import this ONCE (via main.jsx or a shared util)
 * so every component can use any chart type without re-registering.
 *
 * Registers ALL built-in scales, elements, and plugins.
 */
import {
  Chart as ChartJS,
  // Scales
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,   // ← required for Radar charts
  TimeScale,
  TimeSeriesScale,
  // Elements
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  // Plugins
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle,
} from "chart.js";

ChartJS.register(
  // Scales
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  // Elements
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  // Plugins
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle,
);

export default ChartJS;
