// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {OverviewManager} from './lib/overviewManager.js';

export default class OverviewHighlightExtension extends Extension {
    enable() {
        this._settings = this.getSettings('org.gnome.shell.extensions.overview-highlight');
        this._overviewManager = new OverviewManager(this._settings);
    }

    disable() {
        this._overviewManager.destroy();
        this._overviewManager = null;
        this._settings = null;
    }
}
