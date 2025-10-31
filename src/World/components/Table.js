import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function createTableHybrid(){
  const group = new THREE.Group();
  const loader = new GLTFLoader();
  // Defaults
  const playY = 0.8;
  let playArea = { length: 10, width: 5, y: playY + 0.001 };

  try{
    const gltf = await loader.loadAsync('./src/World/assets/models/table.glb');
    const table = gltf.scene;
    table.traverse(o=>{ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
    // Auto scale/center to fit default footprint if needed
    const box = new THREE.Box3().setFromObject(table);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    table.position.sub(center); // center on origin
    // if table very large/small, normalize roughly to our defaults
    const targetX = 10.5, targetZ = 5.5;
    const scale = Math.min(targetX/Math.max(size.x,0.001), targetZ/Math.max(size.z,0.001));
    table.scale.setScalar(scale);
    // Y offset so top surface ~ playY
    // Try to find top plane Y by recomputing bbox
    const box2 = new THREE.Box3().setFromObject(table);
    const maxY = box2.max.y;
    table.position.y = playY - maxY + 0.02;
    group.add(table);

    // play area estimate (slightly smaller than table bbox)
    const box3 = new THREE.Box3().setFromObject(table);
    const sz = new THREE.Vector3(); box3.getSize(sz);
    playArea.length = sz.x * 0.88;
    playArea.width = sz.z * 0.88;
    playArea.y = playY + 0.001;
  }catch(e){
    // Fallback: simple green plane
    const felt = new THREE.Mesh(
      new THREE.PlaneGeometry(playArea.length, playArea.width),
      new THREE.MeshStandardMaterial({ color:'#0a5a2b' })
    );
    felt.rotation.x = -Math.PI/2;
    felt.position.y = playY;
    felt.receiveShadow = true;
    group.add(felt);
    // small props
    const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.08,0.15),
      new THREE.MeshStandardMaterial({ color:'#2aa4ff' }));
    chalk.position.set(0.6, playY+0.05, 2.0);
    group.add(chalk);
  }

  group.userData.playArea = playArea;
  return group;
}
