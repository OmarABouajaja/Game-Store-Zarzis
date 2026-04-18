import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
}

/**
 * SEO Component
 * Dynamically updates page metadata based on props.
 * Falls back to defaults from index.html if not provided.
 */
const SEO = ({
    title,
    description,
    keywords,
    ogImage,
    ogType = "website"
}: SEOProps) => {
    const location = useLocation();

    useEffect(() => {
        // Base title
        const baseTitle = "Game Store Zarzis";
        const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} - Réparation Tech & Zone Gaming`;
        document.title = fullTitle;

        // Update meta description
        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute("content", description);
            }
        }

        // Update meta keywords
        if (keywords) {
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords) {
                metaKeywords.setAttribute("content", keywords);
            }
        }

        // Update Open Graph tags
        const updateOGTag = (property: string, content: string) => {
            const tag = document.querySelector(`meta[property="${property}"]`);
            if (tag) {
                tag.setAttribute("content", content);
            }
        };

        updateOGTag("og:title", fullTitle);
        updateOGTag("og:url", window.location.href);
        updateOGTag("og:type", ogType);

        if (description) {
            updateOGTag("og:description", description);
        }

        if (ogImage) {
            updateOGTag("og:image", ogImage);
        }

        // Update Twitter Card tags
        const updateTwitterTag = (name: string, content: string) => {
            const tag = document.querySelector(`meta[name="${name}"]`);
            if (tag) {
                tag.setAttribute("content", content);
            }
        };

        updateTwitterTag("twitter:title", fullTitle);
        if (description) {
            updateTwitterTag("twitter:description", description);
        }
        if (ogImage) {
            updateTwitterTag("twitter:image", ogImage);
        }

    }, [title, description, keywords, ogImage, ogType, location.pathname]);

    return null; // Side-effect only component
};

export default SEO;
