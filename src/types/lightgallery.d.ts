declare module "lightgallery/vue" {
  import type { DefineComponent } from "vue";
  const Lightgallery: DefineComponent<any, any, any>;
  export default Lightgallery;
}

declare module "lightgallery/plugins/zoom" {
  const zoom: any;
  export default zoom;
}

declare module "lightgallery/plugins/video" {
  const video: any;
  export default video;
}
