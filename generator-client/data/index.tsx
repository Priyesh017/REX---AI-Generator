import { useAuth } from "@clerk/nextjs";
import { Home, Coins, User, Sparkles, Settings} from "lucide-react";

const { isSignedIn } = useAuth();
export const menuItems = [
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
      icon: <Sparkles className="h-5 w-5" />,
      label: "Generator",
      href: "/generate",
      gradient:
        "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
      iconColor: "text-green-500",
    },
    {
      icon:
        isSignedIn === null ? (
          <User className="h-5 w-5" />
        ) : isSignedIn ? (
          <Settings className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        ),
      label: isSignedIn === null ? "Login" : isSignedIn ? "Profile" : "Login",
      href: isSignedIn === null ? "#" : isSignedIn ? "/profile" : "#",
      gradient:
        "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
      iconColor: "text-red-500",
    },
  ];