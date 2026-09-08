// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class LassoPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.lasso');

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
        });
        window.add(page);

        // Behavior & Appearance Group
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Behavior &amp; Appearance'),
            description: _('Configure overview multi-window selection options'),
        });
        page.add(behaviorGroup);

        // Highlight Padding Override Row
        const paddingRow = new Adw.SpinRow({
            title: _('Highlight Padding'),
            subtitle: _('Padding in pixels between window previews and the selection outline'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 40,
                step_increment: 1,
            }),
        });
        settings.bind('padding-override', paddingRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(paddingRow);

        // Color Override Expander Row
        const colorExpander = new Adw.ExpanderRow({
            title: _('Color Override'),
            subtitle: _('Override the system accent color with a custom highlight color'),
            show_enable_switch: true,
        });
        settings.bind('use-color-override', colorExpander, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(colorExpander);

        const colorRow = new Adw.ActionRow({
            title: _('Custom Highlight Color'),
            subtitle: _('Color for window highlight outlines and selection marquee'),
        });

        const colorDialog = new Gtk.ColorDialog({
            with_alpha: false,
        });
        const colorButton = new Gtk.ColorDialogButton({
            dialog: colorDialog,
            valign: Gtk.Align.CENTER,
        });

        const initialColorStr = settings.get_string('color-override') || '#3584e4';
        const initialRgba = new Gdk.RGBA();
        initialRgba.parse(initialColorStr);
        colorButton.set_rgba(initialRgba);

        colorButton.connect('notify::rgba', () => {
            const rgba = colorButton.get_rgba();
            const r = Math.round(rgba.red * 255).toString(16).padStart(2, '0');
            const g = Math.round(rgba.green * 255).toString(16).padStart(2, '0');
            const b = Math.round(rgba.blue * 255).toString(16).padStart(2, '0');
            const hex = `#${r}${g}${b}`;
            settings.set_string('color-override', hex);
        });

        colorRow.add_suffix(colorButton);
        colorExpander.add_row(colorRow);

        // Drag Threshold Row
        const dragRow = new Adw.SpinRow({
            title: _('Mouse Box Threshold'),
            subtitle: _('Pointer movement in pixels required to start marquee box selection'),
            adjustment: new Gtk.Adjustment({
                lower: 2,
                upper: 30,
                step_increment: 1,
            }),
        });
        settings.bind('drag-threshold', dragRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(dragRow);

        // Close on Delete Key
        const deleteRow = new Adw.SwitchRow({
            title: _('Close on Delete Key'),
            subtitle: _('Allow closing all selected windows with Delete, Backspace, or Ctrl+W in Overview'),
        });
        settings.bind('close-on-delete-key', deleteRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(deleteRow);

        // Shortcuts & Interaction Guide Group
        const shortcutsGroup = new Adw.PreferencesGroup({
            title: _('Shortcuts &amp; Usage'),
            description: _('How to select and manage multiple windows in the Overview'),
        });
        page.add(shortcutsGroup);

        const addGuideRow = (title, subtitle, iconName) => {
            const row = new Adw.ActionRow({
                title,
                subtitle,
            });
            if (iconName) {
                const icon = new Gtk.Image({
                    icon_name: iconName,
                    accessible_role: Gtk.AccessibleRole.PRESENTATION,
                });
                row.add_prefix(icon);
            }
            shortcutsGroup.add(row);
        };

        addGuideRow(
            _('Mouse Box Selection'),
            _('Click and drag across workspace background to marquee-select windows'),
            'input-mouse-symbolic'
        );
        addGuideRow(
            _('Ctrl + Click'),
            _('Toggle individual windows in and out of selection (discontinuous range)'),
            'input-keyboard-symbolic'
        );
        addGuideRow(
            _('Shift + Click'),
            _('Select all windows in a continuous range from the previous selection'),
            'input-keyboard-symbolic'
        );
        addGuideRow(
            _('Escape / Click Background'),
            _('Deselect all windows and dismiss the floating action bar'),
            'edit-clear-symbolic'
        );
        addGuideRow(
            _('Drag & Drop to Workspace'),
            _('Drag any selected window to another workspace or thumbnail to move all selected windows together'),
            'view-paged-symbolic'
        );
        addGuideRow(
            _('Native Accent Color'),
            _('Highlights automatically use the primary accent color selected in GNOME Settings'),
            'preferences-color-symbolic'
        );
    }
}
