import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRect, rectsIntersect, pointInRect, rectContains, sortItemsVisually} from '../lib/geometry.js';

test('normalizeRect handles normal top-left to bottom-right coordinates', () => {
    const rect = normalizeRect(10, 20, 50, 70);
    assert.deepEqual(rect, {x: 10, y: 20, width: 40, height: 50});
});

test('normalizeRect handles reverse bottom-right to top-left coordinates', () => {
    const rect = normalizeRect(50, 70, 10, 20);
    assert.deepEqual(rect, {x: 10, y: 20, width: 40, height: 50});
});

test('rectsIntersect correctly detects intersecting rectangles', () => {
    const r1 = {x: 10, y: 10, width: 50, height: 50};
    const r2 = {x: 40, y: 40, width: 50, height: 50};
    assert.equal(rectsIntersect(r1, r2), true);
});

test('rectsIntersect detects non-intersecting rectangles', () => {
    const r1 = {x: 10, y: 10, width: 20, height: 20};
    const r2 = {x: 40, y: 40, width: 20, height: 20};
    assert.equal(rectsIntersect(r1, r2), false);
});

test('rectsIntersect detects touching edges as non-intersecting', () => {
    const r1 = {x: 0, y: 0, width: 10, height: 10};
    const r2 = {x: 10, y: 0, width: 10, height: 10};
    assert.equal(rectsIntersect(r1, r2), false);
});

test('pointInRect correctly tests coordinates', () => {
    const rect = {x: 20, y: 30, width: 50, height: 50};
    assert.equal(pointInRect(25, 35, rect), true);
    assert.equal(pointInRect(20, 30, rect), true);
    assert.equal(pointInRect(70, 80, rect), true);
    assert.equal(pointInRect(15, 35, rect), false);
    assert.equal(pointInRect(75, 85, rect), false);
});

test('rectContains correctly checks full containment', () => {
    const outer = {x: 0, y: 0, width: 100, height: 100};
    const inner = {x: 10, y: 10, width: 20, height: 20};
    const overlapping = {x: 90, y: 90, width: 30, height: 30};

    assert.equal(rectContains(outer, inner), true);
    assert.equal(rectContains(outer, overlapping), false);
});

test('sortItemsVisually sorts items horizontally within a single row with variable heights', () => {
    const items = [
        {id: 'w3', bounds: {x: 700, y: 110, width: 180, height: 130}},
        {id: 'w1', bounds: {x: 100, y: 100, width: 200, height: 150}},
        {id: 'w2', bounds: {x: 400, y: 80, width: 250, height: 190}},
    ];

    const sorted = sortItemsVisually(items, item => item.bounds);
    assert.deepEqual(sorted.map(i => i.id), ['w1', 'w2', 'w3']);
});

test('sortItemsVisually sorts multi-row grid into top-to-bottom, left-to-right reading order', () => {
    const items = [
        {id: 'r2-w2', bounds: {x: 450, y: 400, width: 250, height: 200}},
        {id: 'r1-w1', bounds: {x: 100, y: 100, width: 250, height: 200}},
        {id: 'r2-w1', bounds: {x: 100, y: 420, width: 250, height: 180}},
        {id: 'r1-w2', bounds: {x: 450, y: 90, width: 250, height: 210}},
    ];

    const sorted = sortItemsVisually(items, item => item.bounds);
    assert.deepEqual(sorted.map(i => i.id), ['r1-w1', 'r1-w2', 'r2-w1', 'r2-w2']);
});
