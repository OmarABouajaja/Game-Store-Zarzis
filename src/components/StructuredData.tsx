import { memo } from "react";

interface StructuredDataProps {
    data: object;
    id?: string;
}

/**
 * StructuredData Component
 * Injects JSON-LD structured data into the page.
 */
const StructuredData = ({ data, id }: StructuredDataProps) => {
    return (
        <script
            type="application/ld+json"
            id={id}
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
};

export default memo(StructuredData);
