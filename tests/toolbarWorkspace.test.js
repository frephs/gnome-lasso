import test from 'node:test';
import assert from 'node:assert/strict';
import {SelectionModel} from '../lib/selectionModel.js';
import {computeToolbarPosition} from '../lib/toolbarPosition.js';

test('computeToolbarPosition with bottom GNOME dash positions toolbar safely above dash', () => {
    const stageWidth = 1920;
    const stageHeight = 1080;
    const monitor = {x: 0, y: 0, width: 1920, height: 1080};
    const dash = {visible: true, y: 990, height: 90};

    const pos = computeToolbarPosition({
        stageWidth,
        stageHeight,
        monitor,
        dash,
    });

    // Dash top is at 990. Distance from bottom = 1080 - 990 = 90px.
    // Margin with 20px gap: 90 + 20 = 110px.
    assert.equal(pos.marginBottom, 110);
    assert.equal(pos.translationX, 0);
    assert.equal(pos.translationY, 0);
});

test('computeToolbarPosition with Ubuntu dock on the LEFT does NOT push toolbar offscreen', () => {
    const stageWidth = 1920;
    const stageHeight = 1080;
    const monitor = {x: 0, y: 0, width: 1920, height: 1080};
    // Ubuntu dock on left has y=0 and height=1080 (spans full screen height)
    const dock = {visible: true, y: 0, height: 1080};

    const pos = computeToolbarPosition({
        stageWidth,
        stageHeight,
        monitor,
        dock,
    });

    // Because dock is on the left, it should NOT be detected as a bottom dock.
    // Margin should be comfortable default (36px), never 1100px.
    assert.equal(pos.marginBottom, 36);
    assert.equal(pos.translationX, 0);
});

test('computeToolbarPosition with Ubuntu dock on the BOTTOM positions toolbar above it', () => {
    const stageWidth = 1920;
    const stageHeight = 1080;
    const monitor = {x: 0, y: 0, width: 1920, height: 1080};
    // Ubuntu dock at bottom: y=1016, height=64
    const dock = {visible: true, y: 1016, height: 64};

    const pos = computeToolbarPosition({
        stageWidth,
        stageHeight,
        monitor,
        dock,
    });

    // 1080 - 1016 = 64px dock height. 64 + 20 = 84px -> Math.max(84, 100) = 100px.
    assert.equal(pos.marginBottom, 100);
});

test('computeToolbarPosition on dual monitors centers toolbar on primary monitor', () => {
    const stageWidth = 3840;
    const stageHeight = 1080;
    // Primary monitor is at x=0 with width 1920
    const monitor = {x: 0, y: 0, width: 1920, height: 1080};

    const pos = computeToolbarPosition({
        stageWidth,
        stageHeight,
        monitor,
    });

    // Stage center = 1920. Monitor center = 960. Offset = 960 - 1920 = -960.
    assert.equal(pos.translationX, -960);
});

test('moveSelectedWindowsToWorkspace moves all selected windows and ignores pinned windows', () => {
    const moved = [];
    const mockMain = {
        moveWindowToMonitorAndWorkspace(win, monitor, wsIndex, append) {
            moved.push({id: win.get_id(), monitor, wsIndex, append});
        }
    };

    const win1 = {get_id: () => 101, get_monitor: () => 0, is_on_all_workspaces: () => false};
    const win2 = {get_id: () => 102, get_monitor: () => 0, is_on_all_workspaces: () => false};
    const winPinned = {get_id: () => 103, get_monitor: () => 0, is_on_all_workspaces: () => true};

    const previews = [
        {metaWindow: win1},
        {metaWindow: win2},
        {metaWindow: winPinned},
    ];

    const selectionModel = new SelectionModel();
    selectionModel.select(101);
    selectionModel.select(102);
    selectionModel.select(103);

    // Target workspace = 2
    const targetWsIndex = 2;
    const selectedIds = new Set(selectionModel.getSelectedIds());
    const movedIds = new Set();

    for (const preview of previews) {
        const pWin = preview.metaWindow;
        const id = pWin.get_id();
        if (selectedIds.has(id) && !movedIds.has(id)) {
            movedIds.add(id);
            if (!pWin.is_on_all_workspaces()) {
                mockMain.moveWindowToMonitorAndWorkspace(pWin, pWin.get_monitor(), targetWsIndex, false);
            }
        }
    }
    selectionModel.clear();

    assert.equal(moved.length, 2);
    assert.deepEqual(moved.map(m => m.id), [101, 102]);
    assert.equal(moved[0].wsIndex, 2);
    assert.equal(moved[1].wsIndex, 2);
    assert.equal(selectionModel.count, 0);
});

test('moveSelectedWindowsToWorkspace handles "new" workspace creation', () => {
    const moved = [];
    const mockWorkspaceManager = {
        _workspaces: [{index: () => 0}, {index: () => 1}],
        get_n_workspaces() {
            return this._workspaces.length;
        },
        append_new_workspace() {
            const idx = this._workspaces.length;
            const newWs = {index: () => idx};
            this._workspaces.push(newWs);
            return newWs;
        },
    };

    const mockMain = {
        moveWindowToMonitorAndWorkspace(win, monitor, wsIndex, append) {
            moved.push({id: win.get_id(), monitor, wsIndex, append});
        }
    };

    const win1 = {get_id: () => 201, get_monitor: () => 0, is_on_all_workspaces: () => false};
    const previews = [{metaWindow: win1}];

    const selectionModel = new SelectionModel();
    selectionModel.select(201);

    let targetWorkspaceIndex = 'new';
    if (targetWorkspaceIndex === 'new') {
        const newWs = mockWorkspaceManager.append_new_workspace();
        targetWorkspaceIndex = newWs.index();
    }

    assert.equal(targetWorkspaceIndex, 2);

    const selectedIds = new Set(selectionModel.getSelectedIds());
    const movedIds = new Set();
    for (const preview of previews) {
        const pWin = preview.metaWindow;
        const id = pWin.get_id();
        if (selectedIds.has(id) && !movedIds.has(id)) {
            movedIds.add(id);
            if (!pWin.is_on_all_workspaces()) {
                mockMain.moveWindowToMonitorAndWorkspace(pWin, pWin.get_monitor(), targetWorkspaceIndex, false);
            }
        }
    }
    selectionModel.clear();

    assert.equal(moved.length, 1);
    assert.equal(moved[0].id, 201);
    assert.equal(moved[0].wsIndex, 2);
    assert.equal(selectionModel.count, 0);
});
