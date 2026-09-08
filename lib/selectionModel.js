// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import {rectsIntersect} from './geometry.js';

/**
 * Pure state model for multi-item selection.
 */
export class SelectionModel {
    constructor() {
        this._selectedIds = new Set();
        this._anchorId = null;
        this._listeners = new Set();
    }

    /**
     * Add a listener callback invoked when selection changes.
     * @param {Function} callback
     */
    addListener(callback) {
        this._listeners.add(callback);
    }

    /**
     * Remove a listener callback.
     * @param {Function} callback
     */
    removeListener(callback) {
        this._listeners.delete(callback);
    }

    _notify() {
        const selected = this.getSelectedIds();
        for (const listener of this._listeners)
            listener(selected, this);
    }

    /**
     * @param {*} id
     * @returns {boolean}
     */
    isSelected(id) {
        return this._selectedIds.has(id);
    }

    /**
     * @returns {Array<*>}
     */
    getSelectedIds() {
        return Array.from(this._selectedIds);
    }

    /**
     * @returns {number}
     */
    get count() {
        return this._selectedIds.size;
    }

    /**
     * @returns {boolean}
     */
    get hasSelection() {
        return this._selectedIds.size > 0;
    }

    /**
     * @returns {*}
     */
    get anchorId() {
        return this._anchorId;
    }

    /**
     * @param {*} id
     */
    setAnchor(id) {
        this._anchorId = id;
    }

    /**
     * Selects a single item.
     *
     * @param {*} id
     * @param {boolean} [makeAnchor=true]
     */
    select(id, makeAnchor = true) {
        let changed = false;
        if (!this._selectedIds.has(id)) {
            this._selectedIds.add(id);
            changed = true;
        }
        if (makeAnchor)
            this._anchorId = id;

        if (changed)
            this._notify();
    }

    /**
     * Deselects a single item.
     *
     * @param {*} id
     */
    deselect(id) {
        if (this._selectedIds.delete(id)) {
            if (this._anchorId === id)
                this._anchorId = null;
            this._notify();
        }
    }

    /**
     * Toggles the selection of an item (for Ctrl+click discontinuous selection).
     *
     * @param {*} id
     * @param {boolean} [makeAnchor=true]
     */
    toggle(id, makeAnchor = true) {
        if (this._selectedIds.has(id)) {
            this._selectedIds.delete(id);
            if (this._anchorId === id)
                this._anchorId = null;
        } else {
            this._selectedIds.add(id);
            if (makeAnchor)
                this._anchorId = id;
        }
        this._notify();
    }

    /**
     * Selects a continuous range of items from anchor to target (for Shift+click).
     *
     * @param {Array<*>} orderedIds - List of IDs in visual/workspace order
     * @param {*} targetId - Target clicked ID
     */
    selectRange(orderedIds, targetId) {
        if (!orderedIds || orderedIds.length === 0)
            return;

        const targetIndex = orderedIds.indexOf(targetId);
        if (targetIndex === -1)
            return;

        let anchorIndex = this._anchorId !== null
            ? orderedIds.indexOf(this._anchorId)
            : -1;

        if (anchorIndex === -1) {
            // Find if any item in orderedIds is already selected
            const selectedIndices = [];
            for (let i = 0; i < orderedIds.length; i++) {
                if (this._selectedIds.has(orderedIds[i]))
                    selectedIndices.push(i);
            }

            if (selectedIndices.length > 0) {
                // Anchor at the selected item closest to target
                selectedIndices.sort((a, b) => Math.abs(a - targetIndex) - Math.abs(b - targetIndex));
                anchorIndex = selectedIndices[0];
                this._anchorId = orderedIds[anchorIndex];
            } else {
                // No item in this scope was selected yet: anchor at target
                anchorIndex = targetIndex;
                this._anchorId = targetId;
            }
        }

        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);

        const currentScopeIds = new Set(orderedIds);
        for (const id of currentScopeIds)
            this._selectedIds.delete(id);

        for (let i = start; i <= end; i++)
            this._selectedIds.add(orderedIds[i]);

        this._notify();
    }

    /**
     * Selects items intersecting a box marquee.
     *
     * @param {Array<{id: *, bounds: {x: number, y: number, width: number, height: number}}>} itemsWithBounds
     * @param {{x: number, y: number, width: number, height: number}} boxRect
     * @param {{addToSelection?: boolean}} [options={}]
     */
    selectBox(itemsWithBounds, boxRect, {addToSelection = false} = {}) {
        if (!itemsWithBounds)
            return;

        const currentScopeIds = new Set(itemsWithBounds.map(item => item.id));

        if (!addToSelection) {
            // Only clear items in the current scope/workspace so other workspaces are preserved
            for (const id of currentScopeIds)
                this._selectedIds.delete(id);
        }

        let firstHit = null;
        for (const item of itemsWithBounds) {
            if (rectsIntersect(item.bounds, boxRect)) {
                this._selectedIds.add(item.id);
                if (firstHit === null)
                    firstHit = item.id;
            }
        }

        if (firstHit !== null && !this._anchorId)
            this._anchorId = firstHit;

        this._notify();
    }

    /**
     * Selects all given IDs.
     *
     * @param {Array<*>} orderedIds
     */
    selectAll(orderedIds) {
        if (!orderedIds || orderedIds.length === 0)
            return;

        for (const id of orderedIds)
            this._selectedIds.add(id);

        if (!this._anchorId)
            this._anchorId = orderedIds[0];

        this._notify();
    }

    /**
     * Clears the current selection and anchor.
     */
    clear() {
        if (this._selectedIds.size === 0 && this._anchorId === null)
            return;

        this._selectedIds.clear();
        this._anchorId = null;
        this._notify();
    }
}
