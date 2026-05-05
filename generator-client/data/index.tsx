import { Home, Coins, User, Wand2, Settings, LayoutDashboard } from "lucide-react";

export const getMenuItems = (isSignedIn: boolean | null) => [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Home",
    href: "/",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <Coins className="h-5 w-5" />,
    label: "Pricing",
    href: "/buy",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    label: "Studio",
    href: "/studio",
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  // Profile / Login — shown based on auth state
  ...(isSignedIn === true
    ? [
        {
          icon: <LayoutDashboard className="h-5 w-5" />,
          label: "Profile",
          href: "/profile",
          gradient:
            "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
          iconColor: "text-red-500",
        },
      ]
    : [
        {
          icon: <User className="h-5 w-5" />,
          label: isSignedIn === null ? "Login" : "Login",
          href: "#",
          gradient:
            "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
          iconColor: "text-red-500",
        },
      ]),
  // Settings — only when signed in
  ...(isSignedIn === true
    ? [
        {
          icon: <Settings className="h-5 w-5" />,
          label: "Settings",
          href: "/profile",
          gradient:
            "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
          iconColor: "text-purple-500",
        },
      ]
    : []),
];