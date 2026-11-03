import {describe,it,expect} from 'vitest';
import {LEVELS,isLevelComplete,starsForLevel} from './levels';

describe('campaign structure and objective rules',()=>{
 it('defines 30 unique levels across three 10-level chapters',()=>{
  expect(LEVELS).toHaveLength(30);
  expect(new Set(LEVELS.map(level=>level.name)).size).toBe(30);
  expect(LEVELS.filter(level=>level.chapter===1)).toHaveLength(10);
  expect(LEVELS.filter(level=>level.chapter===2)).toHaveLength(10);
  expect(LEVELS.filter(level=>level.chapter===3)).toHaveLength(10);
 });
 it('covers all four objective types',()=>{
  expect(new Set(LEVELS.map(level=>level.objective))).toEqual(new Set(['score','lines','combo','multi']));
 });
 it('evaluates each objective from its matching statistic',()=>{
  expect(isLevelComplete(LEVELS[0],{score:220,lines:0,combo:0,multi:0})).toBe(true);
  expect(isLevelComplete(LEVELS[1],{score:0,lines:2,combo:0,multi:0})).toBe(true);
  expect(isLevelComplete(LEVELS[3],{score:0,lines:0,combo:2,multi:0})).toBe(true);
  expect(isLevelComplete(LEVELS[6],{score:0,lines:0,combo:0,multi:1})).toBe(true);
 });
 it('awards no stars before completion and scales completed results',()=>{
  const level=LEVELS[0];
  expect(starsForLevel(level,{score:219,lines:0,combo:0,multi:0})).toBe(0);
  expect(starsForLevel(level,{score:220,lines:0,combo:0,multi:0})).toBe(1);
  expect(starsForLevel(level,{score:400,lines:0,combo:0,multi:0})).toBe(3);
 });
});
