import * as THREE from 'three';
export const Light = {
  create(){
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(6,10,6);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048,2048);
    const helper = new THREE.DirectionalLightHelper(directionalLight, 0.5);
    return { ambientLight, directionalLight, directionalLightHelper: helper };
  }
};