// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import {normalizeRect} from './geometry.js';

/**
 * Visual rubberband selection rectangle for the Overview workspace.
 */
export const RubberbandActor = GObject.registerClass({
    GTypeName: 'OverviewHighlightRubberbandActor',
}, class RubberbandActor extends St.Widget {
    _init(params = {}) {
        super._init({
            style_class: 'overview-selection-rubberband',
            reactive: false,
            visible: false,
            ...params,
        });

        this._startX = 0;
        this._startY = 0;
        this._currentX = 0;
        this._currentY = 0;
    }

    /**
     * Starts the rubberband at origin coordinates.
     * @param {number} x
     * @param {number} y
     */
    start(x, y) {
        this._startX = x;
        this._startY = y;
        this._currentX = x;
        this._currentY = y;

        this.set_position(x, y);
        this.set_size(0, 0);
        this.visible = true;
    }

    /**
     * Updates the rubberband size and position as the pointer moves.
     * @param {number} x
     * @param {number} y
     */
    update(x, y) {
        this._currentX = x;
        this._currentY = y;

        const rect = normalizeRect(this._startX, this._startY, x, y);
        this.set_position(rect.x, rect.y);
        this.set_size(rect.width, rect.height);
    }

    /**
     * Returns current normalized rectangle coordinates in stage space.
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getGeometry() {
        return normalizeRect(
            this._startX,
            this._startY,
            this._currentX,
            this._currentY
        );
    }

    /**
     * Finishes rubberband selection and hides actor.
     */
    finish() {
        this.visible = false;
    }

    /**
     * Applies a custom color override to the rubberband selection rectangle.
     * @param {string|null} color
     */
    setColorOverride(color) {
        if (color) {
            let cleaned = color.replace('#', '');
            if (cleaned.length === 3)
                cleaned = cleaned.split('').map(c => c + c).join('');
            const num = parseInt(cleaned, 16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            this.set_style(
                `border: 2px solid ${color}; ` +
                `background-color: rgba(${r}, ${g}, ${b}, 0.18); ` +
                `border-radius: 6px; ` +
                `box-shadow: none;`
            );
        } else {
            this.set_style('');
        }
    }
});
