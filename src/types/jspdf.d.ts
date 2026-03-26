declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'p' | 'portrait' | 'l' | 'landscape';
    unit?: 'pt' | 'mm' | 'cm' | 'in';
    format?: string | [number, number];
    compress?: boolean;
  }

  export interface jsPDF {
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void;
    save(filename: string): void;
  }

  export class jsPDF {
    constructor(options?: jsPDFOptions);
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void;
    save(filename: string): void;
  }

  export default jsPDF;
}
