import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // =====================
  // Protected Dashboard Layout
  // =====================
  layout("components/layout.tsx", [
    index("routes/dashboard.tsx"),
    route("/autopost", "routes/auto-post.tsx"),
    route("/sales", "routes/sales.tsx"),
    route("/stock", "routes/stock.tsx"),
  ]),

  route("/login", "routes/login.tsx"),

] satisfies RouteConfig;
