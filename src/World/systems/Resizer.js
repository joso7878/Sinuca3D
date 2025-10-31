export class Resizer{
  constructor(container, camera, renderer){
    const onResize = ()=>{
      camera.aspect = container.clientWidth/container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    onResize();
    window.addEventListener('resize', onResize);
  }
}
