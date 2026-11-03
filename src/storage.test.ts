import {describe,it,expect} from 'vitest';
import {DEFAULT_SAVE,loadSave,saveData,todayKey,type SaveData} from './storage';

class MemoryStorage implements Storage{
 private values=new Map<string,string>();
 get length(){return this.values.size}
 clear(){this.values.clear()}
 getItem(key:string){return this.values.get(key)??null}
 key(index:number){return [...this.values.keys()][index]??null}
 removeItem(key:string){this.values.delete(key)}
 setItem(key:string,value:string){this.values.set(key,String(value))}
}

describe('local save reliability',()=>{
 it('returns a safe default when data is missing',()=>expect(loadSave(new MemoryStorage())).toEqual(DEFAULT_SAVE));
 it('round trips a save record',()=>{
  const storage=new MemoryStorage(),value:SaveData={...DEFAULT_SAVE,bestScore:900,levelUnlocked:7,levelStars:{1:3,4:2},sound:false};
  expect(saveData(value,storage)).toBe(true);
  expect(loadSave(storage)).toMatchObject({bestScore:900,levelUnlocked:7,levelStars:{1:3,4:2},sound:false});
 });
 it('recovers from malformed JSON and corrupt numeric fields',()=>{
  const storage=new MemoryStorage();storage.setItem('block-bloom-save-v1','{bad json');
  expect(loadSave(storage).bestScore).toBe(0);
  storage.setItem('block-bloom-save-v1',JSON.stringify({version:1,bestScore:-12,levelUnlocked:900,levelStars:{'3':99,'100':3},sound:'yes'}));
  expect(loadSave(storage)).toMatchObject({bestScore:0,levelUnlocked:30,levelStars:{3:3},sound:true});
 });
 it('returns false rather than throwing when storage is unavailable',()=>{
  const broken={getItem(){throw new Error('blocked')},setItem(){throw new Error('quota')},removeItem(){},clear(){},key(){return null},length:0} as unknown as Storage;
  expect(loadSave(broken).version).toBe(1);expect(saveData(DEFAULT_SAVE,broken)).toBe(false);
 });
 it('formats local calendar dates consistently',()=>expect(todayKey(new Date(2026,10,4))).toBe('2026-11-04'));
});
