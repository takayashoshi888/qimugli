declare module 'html2canvas' {
  export interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string | null;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    windowWidth?: number;
    windowHeight?: number;
  }

  export interface Html2CanvasResult {
    width: number;
    height: number;
    toDataURL(type?: string, quality?: number): string;
  }

  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<Html2CanvasResult>;

  export default html2canvas;
}
