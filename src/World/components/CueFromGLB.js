import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadCue(playY){
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('./src/World/assets/models/cue.glb');
  const cue = gltf.scene;
  cue.traverse(o=>{ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
  cue.position.set(0.45, playY + 0.3, 2.7);
  cue.rotation.y = -0.08;
  return cue;
}
