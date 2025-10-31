import * as THREE from 'three';
export const Scene = {
  create(){
    const s = new THREE.Scene();
    s.background = new THREE.Color('#202426');
    return s;
  }
};