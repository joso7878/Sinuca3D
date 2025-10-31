import * as THREE from 'three';
export const Renderer = {
  create(){
    const r = new THREE.WebGLRenderer({ antialias:true });
    r.setSize(window.innerWidth, window.innerHeight);
    r.setPixelRatio(window.devicePixelRatio);
    r.shadowMap.enabled = true;
    return r;
  }
};
