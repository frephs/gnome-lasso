// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

/**
 * Computes toolbar bottom margin and stage translation offsets,
 * safely avoiding bottom docks (GNOME Dash, Dash to Dock) while ignoring
 * full-height vertical docks (Ubuntu Dock on left/right).
 *
 * @param {Object} params
 * @param {number} params.stageWidth
 * @param {number} params.stageHeight
 * @param {Object} [params.monitor]
 * @param {Object} [params.dash]
 * @param {Object} [params.dock]
 * @returns {{marginBottom: number, translationX: number, translationY: number}}
 */
export function computeToolbarPosition({
    stageWidth,
    stageHeight,
    monitor = {x: 0, y: 0, width: stageWidth, height: stageHeight},
    dash = null,
    dock = null,
}) {
    let dockTop = monitor.y + monitor.height;
    let dockFound = false;

    // Check GNOME Dash
    if (dash && dash.visible) {
        const dashY = dash.y ?? 0;
        const dashHeight = dash.height ?? 0;

        // Is it a bottom dash?
        if (dashY >= monitor.y + monitor.height * 0.5 && dashHeight < monitor.height * 0.5) {
            dockTop = Math.min(dockTop, dashY);
            dockFound = true;
        } else if (dashY <= 0 && dashHeight > 0 && dashHeight < monitor.height * 0.5) {
            dockTop = Math.min(dockTop, monitor.y + monitor.height - dashHeight);
            dockFound = true;
        }
    }

    // Check Dash-to-Dock / Ubuntu Dock
    if (dock && dock.visible) {
        const dockY = dock.y ?? 0;
        const dockHeight = dock.height ?? 0;

        // Is it a bottom dock?
        if (dockY >= monitor.y + monitor.height * 0.5 && dockHeight < monitor.height * 0.5) {
            dockTop = Math.min(dockTop, dockY);
            dockFound = true;
        }
    }

    const gap = 20; // 20px gap above the dock
    let marginBottom;
    if (dockFound && dockTop < (monitor.y + monitor.height)) {
        const bottomDistance = (monitor.y + monitor.height) - dockTop;
        marginBottom = Math.max(bottomDistance + gap, 100);
    } else {
        // When dock is on left/right or hidden, sit comfortably above bottom edge
        marginBottom = 36;
    }

    // Translation relative to stage center
    const monitorCenterX = monitor.x + (monitor.width / 2);
    const stageCenterX = stageWidth / 2;
    const translationX = Math.round(monitorCenterX - stageCenterX);

    const monitorBottom = monitor.y + monitor.height;
    const translationY = Math.round(monitorBottom - stageHeight);

    return {marginBottom, translationX, translationY};
}
