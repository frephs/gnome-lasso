// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

/**
 * Floating Action Toolbar displayed when multiple windows are selected in Overview.
 */
export const ActionToolbar = GObject.registerClass({
    GTypeName: 'OverviewHighlightActionToolbar',
}, class ActionToolbar extends St.BoxLayout {
    _init(params = {}) {
        super._init({
            style_class: 'overview-action-toolbar-container',
            vertical: true,
            reactive: true,
            visible: false,
            opacity: 0,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.END,
            ...params,
        });

        this._closeCallback = null;
        this._deselectCallback = null;
        this._moveToWorkspaceCallback = null;
        this._isPopupOpen = false;

        // Floating workspace picker popup (anchored above the main toolbar pill)
        this._popupBox = new St.BoxLayout({
            style_class: 'overview-workspace-popup',
            reactive: true,
            visible: false,
            opacity: 0,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._popupBox);

        // Main action toolbar horizontal pill
        this._mainToolbar = new St.BoxLayout({
            style_class: 'overview-action-toolbar',
            reactive: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._mainToolbar);

        // Selected count badge
        this._badge = new St.Label({
            style_class: 'overview-action-toolbar-badge',
            text: '0 Selected',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._mainToolbar.add_child(this._badge);

        // Move to Workspace button
        this._moveBtn = new St.Button({
            style_class: 'overview-action-button',
            label: 'Move to Workspace ▾',
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._moveBtn.connect('clicked', () => this.toggleWorkspacePopup());
        this._mainToolbar.add_child(this._moveBtn);

        // Close all selected windows button
        this._closeBtn = new St.Button({
            style_class: 'overview-action-button destructive',
            label: '✕ Close Windows',
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._closeBtn.connect('clicked', () => {
            if (this._closeCallback)
                this._closeCallback();
        });
        this._mainToolbar.add_child(this._closeBtn);

        // Deselect button
        this._deselectBtn = new St.Button({
            style_class: 'overview-action-button',
            label: 'Deselect',
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._deselectBtn.connect('clicked', () => {
            if (this._deselectCallback)
                this._deselectCallback();
        });
        this._mainToolbar.add_child(this._deselectBtn);
    }

    /**
     * Set action callbacks.
     */
    setCallbacks({onClose, onDeselect, onMoveToWorkspace}) {
        this._closeCallback = onClose;
        this._deselectCallback = onDeselect;
        this._moveToWorkspaceCallback = onMoveToWorkspace;
    }

    /**
     * Returns whether the workspace picker popup is currently visible.
     * @returns {boolean}
     */
    isWorkspacePopupOpen() {
        return this._isPopupOpen === true;
    }

    /**
     * Toggles the workspace picker popup.
     */
    toggleWorkspacePopup() {
        if (this._isPopupOpen)
            this.closeWorkspacePopup();
        else
            this.openWorkspacePopup();
    }

    /**
     * Opens the workspace picker popup populated with current workspace options.
     */
    openWorkspacePopup() {
        this._popupBox.destroy_all_children();

        const title = new St.Label({
            style_class: 'overview-workspace-popup-title',
            text: 'Move to:',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._popupBox.add_child(title);

        const workspaceManager = global.workspace_manager;
        const nWorkspaces = workspaceManager?.get_n_workspaces?.() ?? 1;
        const activeIndex = workspaceManager?.get_active_workspace_index?.() ?? 0;

        for (let i = 0; i < nWorkspaces; i++) {
            const isCurrent = i === activeIndex;
            const wsBtn = new St.Button({
                style_class: isCurrent
                    ? 'overview-action-button workspace-btn current'
                    : 'overview-action-button workspace-btn',
                label: isCurrent ? `WS ${i + 1} •` : `WS ${i + 1}`,
                can_focus: !isCurrent,
                reactive: !isCurrent,
                y_align: Clutter.ActorAlign.CENTER,
            });

            if (!isCurrent) {
                wsBtn.connect('clicked', () => {
                    this.closeWorkspacePopup();
                    if (this._moveToWorkspaceCallback)
                        this._moveToWorkspaceCallback(i);
                });
            }
            this._popupBox.add_child(wsBtn);
        }

        // "+ New" workspace button
        const newWsBtn = new St.Button({
            style_class: 'overview-action-button workspace-btn new-ws',
            label: '+ New',
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        newWsBtn.connect('clicked', () => {
            this.closeWorkspacePopup();
            if (this._moveToWorkspaceCallback)
                this._moveToWorkspaceCallback('new');
        });
        this._popupBox.add_child(newWsBtn);

        // Dismiss button
        const dismissBtn = new St.Button({
            style_class: 'overview-action-button workspace-btn dismiss',
            label: '✕',
            can_focus: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        dismissBtn.connect('clicked', () => {
            this.closeWorkspacePopup();
        });
        this._popupBox.add_child(dismissBtn);

        this._popupBox.visible = true;
        this._popupBox.remove_all_transitions();
        this._popupBox.ease({
            opacity: 255,
            duration: 150,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
        this._isPopupOpen = true;
    }

    /**
     * Closes the workspace picker popup.
     */
    closeWorkspacePopup() {
        if (!this._isPopupOpen)
            return;

        this._isPopupOpen = false;
        this._popupBox.remove_all_transitions();
        this._popupBox.ease({
            opacity: 0,
            duration: 120,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this._popupBox.visible = false;
                this._popupBox.destroy_all_children();
            },
        });
    }

    /**
     * Updates toolbar state based on number of selected windows.
     * @param {number} count
     */
    updateSelection(count) {
        if (count > 0) {
            const labelText = count === 1 ? '1 Window Selected' : `${count} Windows Selected`;
            this._badge.text = labelText;
            this.showToolbar();
        } else {
            this.hideToolbar();
        }
    }

    showToolbar() {
        if (this.visible && this.opacity === 255)
            return;

        this.visible = true;
        this.remove_all_transitions();
        this.ease({
            opacity: 255,
            duration: 180,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    hideToolbar() {
        this.closeWorkspacePopup();

        if (!this.visible)
            return;

        this.remove_all_transitions();
        this.ease({
            opacity: 0,
            duration: 150,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this.visible = false;
            },
        });
    }

    /**
     * Applies a custom color override to toolbar elements if applicable.
     * @param {string|null} _color
     */
    setColorOverride(_color) {
        this._badge.set_style('');
    }

    destroy() {
        this.closeWorkspacePopup();
        super.destroy();
    }
});
