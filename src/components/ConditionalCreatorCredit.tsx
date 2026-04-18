import { useLocation } from "react-router-dom";
import { CreatorCredit } from "./CreatorCredit";

export const ConditionalCreatorCredit = () => {
    const location = useLocation();
    const isHomepage = location.pathname === "/";

    // Don't show floating credit on homepage (it has static version in footer)
    if (isHomepage) return null;

    return <CreatorCredit />;
};
