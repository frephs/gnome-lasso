import test from 'node:test';
import assert from 'node:assert/strict';
import {SelectionModel} from '../lib/selectionModel.js';

test('captureSelectedIds returns null if window is not selected', () => {
    const selectionModel = new SelectionModel();
    selectionModel.select(101);

    // Mock capture logic
    const capture = (winId, activeDrag, model) => {
        if (!winId) return null;
        if (activeDrag && activeDrag.has(winId)) return new Set(activeDrag);
        if (model.isSelected(winId)) return new Set(model.getSelectedIds());
        return null;
    };

    assert.equal(capture(999, null, selectionModel), null);
});

test('captureSelectedIds captures snapshot of selected IDs when window is selected', () => {
    const selectionModel = new SelectionModel();
    selectionModel.select(101);
    selectionModel.select(102);
    selectionModel.select(103);

    const capture = (winId, activeDrag, model) => {
        if (!winId) return null;
        if (activeDrag && activeDrag.has(winId)) return new Set(activeDrag);
        if (model.isSelected(winId)) return new Set(model.getSelectedIds());
        return null;
    };

    const captured = capture(101, null, selectionModel);
    assert.deepEqual(Array.from(captured).sort(), [101, 102, 103]);

    // Modifying selection afterwards does not affect captured snapshot
    selectionModel.deselect(101);
    assert.equal(captured.has(101), true);
});

test('captureSelectedIds prefers active drag snapshot if present', () => {
    const selectionModel = new SelectionModel();
    const activeDrag = new Set([201, 202]);

    const capture = (winId, activeDragSet, model) => {
        if (!winId) return null;
        if (activeDragSet && activeDragSet.has(winId)) return new Set(activeDragSet);
        if (model.isSelected(winId)) return new Set(model.getSelectedIds());
        return null;
    };

    const captured = capture(201, activeDrag, selectionModel);
    assert.deepEqual(Array.from(captured).sort(), [201, 202]);
});

test('moveOtherSelectedWindows moves only other windows and ignores pinned windows', () => {
    const moved = [];
    const mockMain = {
        moveWindowToMonitorAndWorkspace(win, monitor, wsIndex, append) {
            moved.push({id: win.get_id(), monitor, wsIndex, append});
        }
    };

    const win101 = {get_id: () => 101, is_on_all_workspaces: () => false};
    const win102 = {get_id: () => 102, is_on_all_workspaces: () => false};
    const win103 = {get_id: () => 103, is_on_all_workspaces: () => true}; // pinned to all workspaces
    const win104 = {get_id: () => 104, is_on_all_workspaces: () => false};

    const previews = [
        {metaWindow: win101, opacity: 140},
        {metaWindow: win102, opacity: 140},
        {metaWindow: win103, opacity: 140},
        {metaWindow: win104, opacity: 255},
    ];

    const selectionModel = new SelectionModel();
    selectionModel.select(101);
    selectionModel.select(102);
    selectionModel.select(103);

    const selectedIds = new Set([101, 102, 103]);
    const winId = 101; // The window that was dragged and dropped

    // Simulate _moveOtherSelectedWindows
    const idsToMove = new Set(selectedIds);
    if (winId) idsToMove.delete(winId);

    const movedIds = new Set();
    const monitorIndex = 1;
    const workspaceIndex = 2;
    const append = false;

    for (const preview of previews) {
        preview.opacity = 255;
        const pWin = preview.metaWindow;
        const id = pWin?.get_id?.();
        if (id && idsToMove.has(id) && !movedIds.has(id)) {
            movedIds.add(id);
            if (!pWin.is_on_all_workspaces?.()) {
                mockMain.moveWindowToMonitorAndWorkspace(pWin, monitorIndex, workspaceIndex, append);
            }
        }
    }

    selectionModel.clear();

    // Verify results:
    // Window 101 was the dragged window, so it was excluded from batch move
    // Window 102 was moved
    // Window 103 was skipped because it is on all workspaces
    assert.deepEqual(moved, [
        {id: 102, monitor: 1, wsIndex: 2, append: false}
    ]);
    assert.equal(selectionModel.count, 0);
    // All previews restored opacity
    assert.ok(previews.every(p => p.opacity === 255));
});

test('inDrop flag protects selection state from being prematurely cleared during preview destroy', () => {
    const selectionModel = new SelectionModel();
    selectionModel.select(1);
    selectionModel.select(2);

    let inDrop = true;

    // Simulate removePreview hook
    const removePreview = (winId) => {
        if (winId && selectionModel && !inDrop) {
            selectionModel.deselect(winId);
        }
    };

    removePreview(1);
    assert.equal(selectionModel.isSelected(1), true);

    inDrop = false;
    removePreview(1);
    assert.equal(selectionModel.isSelected(1), false);
});
