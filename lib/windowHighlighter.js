// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Clutter from 'gi://Clutter';
import St from 'gi://St';

const DEFAULT_PADDING = 12;

function hexToRgba(hex, alpha) {
    if (!hex)
        return `rgba(53, 132, 228, ${alpha})`;
    let cleaned = hex.replace('#', '');
    if (cleaned.length === 3)
        cleaned = cleaned.split('').map(c => c + c).join('');
    const num = parseInt(cleaned, 16);
    if (isNaN(num))
        return `rgba(53, 132, 228, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Manages highlight overlays on WindowPreview actors in the overview.
 */
export class WindowHighlighter {
    constructor(settings = null, selectionModel = null) {
        // Map<WindowPreview, {overlay: St.Widget, constraints: object, destroyId: number, dragBeginId: number}>
        this._previews = new Map();
        this._settings = settings;
        this._selectionModel = selectionModel;
        this._inDrop = false;
        this._dragCallbacks = null;

        this._settingsChangedId = 0;
        if (this._settings) {
            this._settingsChangedId = this._settings.connect('changed', (_s, key) => {
                if (key === 'padding-override' || key === 'use-color-override' || key === 'color-override')
                    this.updateAllOverlays();
            });
        }
    }

    /**
     * @returns {number} Active padding in pixels around window previews
     */
    get padding() {
        if (this._settings) {
            try {
                return this._settings.get_int('padding-override');
            } catch (e) {}
        }
        return DEFAULT_PADDING;
    }

    /**
     * @returns {string|null} Hex color string override or null for system accent color
     */
    get colorOverride() {
        if (this._settings) {
            try {
                if (this._settings.get_boolean('use-color-override'))
                    return this._settings.get_string('color-override');
            } catch (e) {}
        }
        return null;
    }

    _applyOverlayStyle(overlay, constraints) {
        const padding = this.padding;
        const color = this.colorOverride;
        const borderRadius = 10 + padding;

        if (constraints) {
            constraints.x.offset = -padding;
            constraints.y.offset = -padding;
            constraints.width.offset = padding * 2;
            constraints.height.offset = padding * 2;
        }

        if (color) {
            overlay.set_style(
                `border: 3.5px solid ${color}; ` +
                `background-color: ${hexToRgba(color, 0.06)}; ` +
                `border-radius: ${borderRadius}px; ` +
                `box-shadow: none;`
            );
        } else {
            overlay.set_style(
                `border-radius: ${borderRadius}px; ` +
                `box-shadow: none;`
            );
        }
    }

    updateAllOverlays() {
        for (const [, entry] of this._previews.entries()) {
            this._applyOverlayStyle(entry.overlay, entry.constraints);
        }
    }

    setInDrop(inDrop) {
        this._inDrop = inDrop;
    }

    setDragCallbacks(callbacks) {
        this._dragCallbacks = callbacks;
    }

    /**
     * Ensures a WindowPreview has a highlight overlay actor attached.
     *
     * @param {WindowPreview} preview
     * @returns {St.Widget}
     */
    _ensureOverlay(preview) {
        let entry = this._previews.get(preview);
        if (entry)
            return entry.overlay;

        const targetContainer = preview.window_container || preview;

        const overlay = new St.Widget({
            style_class: 'overview-window-selected-highlight',
            reactive: false,
            visible: false,
        });

        const padding = this.padding;
        const constraints = {
            x: new Clutter.BindConstraint({
                source: targetContainer,
                coordinate: Clutter.BindCoordinate.X,
                offset: -padding,
            }),
            y: new Clutter.BindConstraint({
                source: targetContainer,
                coordinate: Clutter.BindCoordinate.Y,
                offset: -padding,
            }),
            width: new Clutter.BindConstraint({
                source: targetContainer,
                coordinate: Clutter.BindCoordinate.WIDTH,
                offset: padding * 2,
            }),
            height: new Clutter.BindConstraint({
                source: targetContainer,
                coordinate: Clutter.BindCoordinate.HEIGHT,
                offset: padding * 2,
            }),
        };

        overlay.add_constraint(constraints.x);
        overlay.add_constraint(constraints.y);
        overlay.add_constraint(constraints.width);
        overlay.add_constraint(constraints.height);

        this._applyOverlayStyle(overlay, constraints);

        preview.add_child(overlay);

        // Ensure app icon and close button stay above highlight overlay
        if (preview._icon)
            preview.set_child_above_sibling(preview._icon, null);
        if (preview._closeButton)
            preview.set_child_above_sibling(preview._closeButton, null);

        // Ensure window title is hidden if not hovering
        if (preview._title && !preview['has-pointer']) {
            preview._title.opacity = 0;
            preview._title.hide();
        }

        // Suppress preview activation when selection mode is active
        if (preview._origActivate === undefined) {
            preview._origActivate = preview._activate;
            const self = this;
            preview._activate = function() {
                if (self._selectionModel?.hasSelection)
                    return;
                return this._origActivate();
            };
        }

        // Show window count badge on drag actor when dragging multiple selected windows
        const dragBeginId = preview.connect('drag-begin', () => {
            const winId = preview.metaWindow?.get_id?.();
            if (winId && this._selectionModel?.isSelected(winId)) {
                const count = this._selectionModel.count;
                if (count > 1 && preview._draggable?._dragActor) {
                    const badge = new St.Label({
                        style_class: 'overview-drag-count-badge',
                        text: `${count} Windows`,
                    });
                    const color = this.colorOverride;
                    if (color)
                        badge.set_style(`background-color: ${color};`);
                    badge.set_position(12, 12);
                    preview._draggable._dragActor.add_child(badge);
                }
            }
            this._dragCallbacks?.onDragBegin?.(preview);
        });

        const dragEndId = preview.connect('drag-end', () => {
            this._dragCallbacks?.onDragEnd?.(preview);
        });

        const dragCancelledId = preview.connect('drag-cancelled', () => {
            this._dragCallbacks?.onDragEnd?.(preview);
        });

        const destroyId = preview.connect('destroy', () => {
            this.removePreview(preview);
        });

        entry = {overlay, constraints, destroyId, dragBeginId, dragEndId, dragCancelledId};
        this._previews.set(preview, entry);

        return overlay;
    }

    /**
     * Sets selection state on a WindowPreview.
     *
     * @param {WindowPreview} preview
     * @param {boolean} selected
     */
    setHighlighted(preview, selected) {
        if (!preview || preview._destroyed)
            return;

        const overlay = this._ensureOverlay(preview);
        overlay.visible = selected;

        if (selected) {
            preview._isSelected = true;

            // Hook showOverlay so titles only show when actually hovering
            if (preview._origShowOverlay === undefined) {
                preview._origShowOverlay = preview.showOverlay;
                preview.showOverlay = function(animate) {
                    const res = this._origShowOverlay(animate);
                    if (this._title && !this['has-pointer']) {
                        this._title.remove_transition('opacity');
                        this._title.opacity = 0;
                        this._title.hide();
                    }
                    return res;
                };
            }

            // Manage overlay hide behavior: hide title on mouse leave, keep close button visible while selected
            if (preview._origHideOverlay === undefined) {
                preview._origHideOverlay = preview.hideOverlay;
                preview.hideOverlay = function(animate) {
                    if (this._isSelected) {
                        if (this._title) {
                            this._title.remove_transition('opacity');
                            if (animate) {
                                this._title.ease({
                                    opacity: 0,
                                    duration: 200,
                                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                                    onComplete: () => this._title.hide(),
                                });
                            } else {
                                this._title.opacity = 0;
                                this._title.hide();
                            }
                        }
                        if (this._closeButton && (typeof this._windowCanClose !== 'function' || this._windowCanClose())) {
                            this._closeButton.opacity = 255;
                            this._closeButton.show();
                        }
                        if (this.window_container) {
                            this.window_container.ease({
                                scale_x: 1,
                                scale_y: 1,
                                duration: animate ? 200 : 0,
                                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                            });
                        }
                        this._overlayShown = false;
                        return;
                    }
                    return this._origHideOverlay(animate);
                };
            }

            // Ensure overlay stays above the preview window content
            preview.set_child_above_sibling(overlay, null);

            // Ensure app icon and close button stay above the highlight overlay
            if (preview._icon)
                preview.set_child_above_sibling(preview._icon, null);

            if (preview._closeButton) {
                preview.set_child_above_sibling(preview._closeButton, null);
                if (typeof preview._windowCanClose !== 'function' || preview._windowCanClose()) {
                    preview._closeButton.opacity = 255;
                    preview._closeButton.show();
                }
            }

            // Do not keep the application label active unless hovering
            if (preview._title && !preview['has-pointer']) {
                preview._title.remove_transition('opacity');
                preview._title.opacity = 0;
                preview._title.hide();
            }
        } else {
            preview._isSelected = false;
            if (!preview['has-pointer']) {
                if (preview._closeButton) {
                    preview._closeButton.remove_transition('opacity');
                    preview._closeButton.opacity = 0;
                    preview._closeButton.hide();
                }
                if (preview._title) {
                    preview._title.remove_transition('opacity');
                    preview._title.opacity = 0;
                    preview._title.hide();
                }
                if (preview._origHideOverlay)
                    preview._origHideOverlay.call(preview, true);
            }
        }
    }

    /**
     * Removes highlight overlay from a single preview.
     *
     * @param {WindowPreview} preview
     */
    removePreview(preview) {
        const entry = this._previews.get(preview);
        if (!entry)
            return;

        this._previews.delete(preview);

        if (preview._origShowOverlay) {
            preview.showOverlay = preview._origShowOverlay;
            delete preview._origShowOverlay;
        }
        if (preview._origHideOverlay) {
            preview.hideOverlay = preview._origHideOverlay;
            delete preview._origHideOverlay;
        }
        if (preview._origActivate) {
            preview._activate = preview._origActivate;
            delete preview._origActivate;
        }
        const winId = preview.metaWindow?.get_id?.();
        if (winId && this._selectionModel && !this._inDrop)
            this._selectionModel.deselect(winId);

        if (entry.destroyId)
            preview.disconnect(entry.destroyId);
        if (entry.dragBeginId)
            preview.disconnect(entry.dragBeginId);
        if (entry.dragEndId)
            preview.disconnect(entry.dragEndId);
        if (entry.dragCancelledId)
            preview.disconnect(entry.dragCancelledId);

        entry.overlay.destroy();
    }

    /**
     * Cleans up all highlight overlays and signal handlers.
     */
    destroy() {
        for (const [preview, entry] of this._previews.entries()) {
            if (preview._origShowOverlay) {
                preview.showOverlay = preview._origShowOverlay;
                delete preview._origShowOverlay;
            }
            if (preview._origHideOverlay) {
                preview.hideOverlay = preview._origHideOverlay;
                delete preview._origHideOverlay;
            }
            if (preview._origActivate) {
                preview._activate = preview._origActivate;
                delete preview._origActivate;
            }
            delete preview._isSelected;

            if (entry.destroyId)
                preview.disconnect(entry.destroyId);
            if (entry.dragBeginId)
                preview.disconnect(entry.dragBeginId);
            if (entry.dragEndId)
                preview.disconnect(entry.dragEndId);
            if (entry.dragCancelledId)
                preview.disconnect(entry.dragCancelledId);

            entry.overlay.destroy();
        }

        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        this._previews.clear();
    }
}
