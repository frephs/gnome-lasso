// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

/**
 * Normalizes two diagonal corner points into a standard rectangle.
 *
 * @param {number} x1 - First X coordinate
 * @param {number} y1 - First Y coordinate
 * @param {number} x2 - Second X coordinate
 * @param {number} y2 - Second Y coordinate
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function normalizeRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    return {x, y, width, height};
}

/**
 * Checks if two axis-aligned rectangles intersect.
 *
 * @param {{x: number, y: number, width: number, height: number}} r1
 * @param {{x: number, y: number, width: number, height: number}} r2
 * @returns {boolean}
 */
export function rectsIntersect(r1, r2) {
    if (!r1 || !r2)
        return false;

    if (r1.width <= 0 || r1.height <= 0 || r2.width <= 0 || r2.height <= 0)
        return false;

    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

/**
 * Checks if a point lies within a rectangle.
 *
 * @param {number} px
 * @param {number} py
 * @param {{x: number, y: number, width: number, height: number}} rect
 * @returns {boolean}
 */
export function pointInRect(px, py, rect) {
    if (!rect)
        return false;

    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

/**
 * Checks if outer rectangle contains the inner rectangle completely.
 *
 * @param {{x: number, y: number, width: number, height: number}} outer
 * @param {{x: number, y: number, width: number, height: number}} inner
 * @returns {boolean}
 */
export function rectContains(outer, inner) {
    if (!outer || !inner)
        return false;

    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
    );
}

/**
 * Sorts items with 2D bounding boxes into natural visual reading order:
 * grouped into visual rows from top to bottom, and ordered left to right within each row.
 *
 * @template T
 * @param {Array<T>} items - Items to sort
 * @param {function(T): {x: number, y: number, width: number, height: number}} getBounds - Function returning bounds for each item
 * @returns {Array<T>} Sorted items
 */
export function sortItemsVisually(items, getBounds) {
    if (!items || items.length <= 1)
        return items ? [...items] : [];

    const entries = items.map((item, index) => {
        const bounds = getBounds(item) ?? {x: 0, y: 0, width: 0, height: 0};
        return {
            item,
            index,
            x: bounds.x ?? 0,
            y: bounds.y ?? 0,
            width: Math.max(0, bounds.width ?? 0),
            height: Math.max(0, bounds.height ?? 0),
        };
    });

    // Primary initial sort by vertical position (Y), then horizontal (X)
    entries.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

    // Group entries into visual rows based on vertical overlap
    const rows = [];
    for (const entry of entries) {
        let placed = false;
        for (const row of rows) {
            const rowMinY = Math.min(...row.map(e => e.y));
            const rowMaxY = Math.max(...row.map(e => e.y + e.height));
            const minHeight = Math.min(entry.height, ...row.map(e => e.height));
            const entryMaxY = entry.y + entry.height;

            const overlap = Math.min(entryMaxY, rowMaxY) - Math.max(entry.y, rowMinY);
            const threshold = minHeight > 0 ? 0.35 * minHeight : 0;

            if (overlap > threshold) {
                row.push(entry);
                placed = true;
                break;
            }
        }

        if (!placed)
            rows.push([entry]);
    }

    // Sort items horizontally within each row (left to right)
    for (const row of rows)
        row.sort((a, b) => a.x - b.x);

    // Sort rows top to bottom by average Y
    rows.sort((r1, r2) => {
        const avgY1 = r1.reduce((acc, e) => acc + e.y, 0) / r1.length;
        const avgY2 = r2.reduce((acc, e) => acc + e.y, 0) / r2.length;
        return avgY1 - avgY2;
    });

    return rows.flatMap(row => row.map(e => e.item));
}
