import test from 'node:test';
import assert from 'node:assert/strict';
import {SelectionModel} from '../lib/selectionModel.js';

test('SelectionModel initial state is empty', () => {
    const model = new SelectionModel();
    assert.equal(model.count, 0);
    assert.equal(model.hasSelection, false);
    assert.equal(model.anchorId, null);
    assert.deepEqual(model.getSelectedIds(), []);
});

test('SelectionModel select and deselect items', () => {
    const model = new SelectionModel();
    let notifications = 0;
    model.addListener(() => notifications++);

    model.select('win-1');
    assert.equal(model.count, 1);
    assert.equal(model.isSelected('win-1'), true);
    assert.equal(model.anchorId, 'win-1');
    assert.equal(notifications, 1);

    model.deselect('win-1');
    assert.equal(model.count, 0);
    assert.equal(model.isSelected('win-1'), false);
    assert.equal(notifications, 2);
});

test('SelectionModel toggle behaves as discontinuous selection (Ctrl+click)', () => {
    const model = new SelectionModel();

    model.toggle('win-1');
    assert.equal(model.isSelected('win-1'), true);
    assert.equal(model.anchorId, 'win-1');

    model.toggle('win-2');
    assert.equal(model.isSelected('win-1'), true);
    assert.equal(model.isSelected('win-2'), true);
    assert.equal(model.count, 2);
    assert.equal(model.anchorId, 'win-2');

    model.toggle('win-1');
    assert.equal(model.isSelected('win-1'), false);
    assert.equal(model.isSelected('win-2'), true);
    assert.equal(model.count, 1);
});

test('SelectionModel selectRange behaves as continuous range selection (Shift+click)', () => {
    const model = new SelectionModel();
    const ordered = ['win-1', 'win-2', 'win-3', 'win-4', 'win-5'];

    // First, select win-2 as anchor
    model.select('win-2');
    assert.equal(model.anchorId, 'win-2');

    // Shift-click win-4: selects win-2, win-3, win-4
    model.selectRange(ordered, 'win-4');
    assert.deepEqual(model.getSelectedIds().sort(), ['win-2', 'win-3', 'win-4']);

    // Reverse range: shift-click win-1
    model.selectRange(ordered, 'win-1');
    assert.deepEqual(model.getSelectedIds().sort(), ['win-1', 'win-2']);
});

test('SelectionModel selectBox selects items intersecting bounding box', () => {
    const model = new SelectionModel();
    const items = [
        {id: 'win-1', bounds: {x: 10, y: 10, width: 50, height: 50}},
        {id: 'win-2', bounds: {x: 70, y: 10, width: 50, height: 50}},
        {id: 'win-3', bounds: {x: 130, y: 10, width: 50, height: 50}},
    ];

    // Marquee enclosing win-1 and win-2
    const marquee = {x: 0, y: 0, width: 100, height: 70};
    model.selectBox(items, marquee);

    assert.equal(model.count, 2);
    assert.equal(model.isSelected('win-1'), true);
    assert.equal(model.isSelected('win-2'), true);
    assert.equal(model.isSelected('win-3'), false);
});

test('SelectionModel selectAll and clear', () => {
    const model = new SelectionModel();
    const ordered = ['w1', 'w2', 'w3'];

    model.selectAll(ordered);
    assert.equal(model.count, 3);

    model.clear();
    assert.equal(model.count, 0);
    assert.equal(model.hasSelection, false);
});

test('SelectionModel aggregates selections across multiple workspaces', () => {
    const model = new SelectionModel();

    // Workspace 1 selection
    const ws1Items = [
        {id: 'ws1-w1', bounds: {x: 10, y: 10, width: 50, height: 50}},
        {id: 'ws1-w2', bounds: {x: 70, y: 10, width: 50, height: 50}},
    ];
    model.selectBox(ws1Items, {x: 0, y: 0, width: 150, height: 70});
    assert.equal(model.count, 2);

    // Workspace 2 selection (without holding Ctrl/addToSelection)
    const ws2Items = [
        {id: 'ws2-w1', bounds: {x: 10, y: 10, width: 50, height: 50}},
        {id: 'ws2-w2', bounds: {x: 70, y: 10, width: 50, height: 50}},
        {id: 'ws2-w3', bounds: {x: 130, y: 10, width: 50, height: 50}},
    ];
    // Select ws2-w1 and ws2-w2 on Workspace 2
    model.selectBox(ws2Items, {x: 0, y: 0, width: 100, height: 70});

    // Total should be aggregated: 2 from WS1 + 2 from WS2 = 4
    assert.equal(model.count, 4);
    assert.equal(model.isSelected('ws1-w1'), true);
    assert.equal(model.isSelected('ws1-w2'), true);
    assert.equal(model.isSelected('ws2-w1'), true);
    assert.equal(model.isSelected('ws2-w2'), true);
    assert.equal(model.isSelected('ws2-w3'), false);
});

test('SelectionModel selectRange establishes anchor on initial shift-click and maintains it', () => {
    const model = new SelectionModel();
    const ordered = ['w1', 'w2', 'w3', 'w4', 'w5'];

    // Initial shift-click on w3 with no prior selection establishes w3 as anchor
    model.selectRange(ordered, 'w3');
    assert.equal(model.anchorId, 'w3');
    assert.deepEqual(model.getSelectedIds(), ['w3']);

    // Subsequent shift-click to w5 expands range [w3..w5]
    model.selectRange(ordered, 'w5');
    assert.equal(model.anchorId, 'w3');
    assert.deepEqual(model.getSelectedIds().sort(), ['w3', 'w4', 'w5']);

    // Subsequent shift-click contracts to w4 [w3..w4]
    model.selectRange(ordered, 'w4');
    assert.equal(model.anchorId, 'w3');
    assert.deepEqual(model.getSelectedIds().sort(), ['w3', 'w4']);

    // Reverse shift-click to w1 expands range [w1..w3]
    model.selectRange(ordered, 'w1');
    assert.equal(model.anchorId, 'w3');
    assert.deepEqual(model.getSelectedIds().sort(), ['w1', 'w2', 'w3']);
});

test('SelectionModel selectRange anchors to nearest selected item if anchor was cleared', () => {
    const model = new SelectionModel();
    const ordered = ['w1', 'w2', 'w3', 'w4', 'w5'];

    // Select w2, then explicitly clear anchor
    model.select('w2');
    model.setAnchor(null);
    assert.equal(model.anchorId, null);

    // Shift-click w4: should anchor at w2 (the nearest selected item)
    model.selectRange(ordered, 'w4');
    assert.equal(model.anchorId, 'w2');
    assert.deepEqual(model.getSelectedIds().sort(), ['w2', 'w3', 'w4']);
});
