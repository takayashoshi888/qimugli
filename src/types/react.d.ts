declare module 'react' {
  export = React;
  export as namespace React;

  namespace React {
    type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNode[];

    interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
      type: T;
      props: P;
      key: Key | null;
    }

    type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);

    type Key = string | number;

    interface Component<P = {}, S = {}> {
      render(): ReactNode;
      props: Readonly<P>;
      state: Readonly<S>;
      setState<K extends keyof S>(state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null), callback?: () => void): void;
      forceUpdate(callback?: () => void): void;
    }

    interface FC<P = {}> {
      (props: P): ReactElement<any, any> | null;
      displayName?: string;
    }

    type FC<P = {}> = FunctionComponent<P>;

    interface FunctionComponent<P = {}> {
      (props: P, context?: any): ReactElement<any, any> | null;
      displayName?: string;
    }

    type ReactText = string | number;
    type ReactChild = ReactElement | ReactText;

    interface ReactPortal extends ReactElement {
      key: Key | null;
      children: ReactNode;
    }

    type Key = string | number;

    type RefObject<T> = { readonly current: T | null };
    type RefCallback<T> = { (instance: T | null): void };
    type Ref<T> = RefCallback<T> | RefObject<T> | null;

    interface MutableRefObject<T> {
      current: T;
    }

    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
    function useContext<T>(context: React.Context<T>): T;
    function useReducer<R extends React.Reducer<any, any>, I>(reducer: R, initialArg: I, init?: (arg: I) => React.ReducerState<R>): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
    function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
    function useRef<T>(initialValue: T): MutableRefObject<T>;
    function useRef<T>(initialValue: T | null): RefObject<T>;
    function useImperativeHandle<T, R extends T>(ref: Ref<T> | undefined, create: () => R, deps?: readonly any[]): void;
    function useLayoutEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
    function useDebugValue<T>(value: T, format?: (value: T) => any): void;

    interface Context<T> {
      Provider: Provider<T>;
      Consumer: Consumer<T>;
      displayName?: string;
    }

    interface Provider<T> {
      (props: { value: T; children?: ReactNode }): ReactElement | null;
    }

    interface Consumer<T> {
      (props: { children: (value: T) => ReactNode }): ReactElement | null;
    }

    function createContext<T>(defaultValue: T): Context<T>;

    function forwardRef<T, P = {}>(render: (props: P, ref: React.Ref<T>) => ReactElement | null): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;

    type FormEvent<T = Element> = NativeEvent<T>;
    type ChangeEvent<T = Element> = NativeEvent<T>;
    type MouseEvent<T = Element> = NativeEvent<T>;
    type KeyboardEvent<T = Element> = NativeEvent<T>;
    type FocusEvent<T = Element> = NativeEvent<T>;

    interface NativeEvent<T = Element> {
      currentTarget: T;
      target: EventTarget;
      preventDefault(): void;
      stopPropagation(): void;
    }

    interface SVGAttributes<T> extends HTMLAttributes<T> {
      fill?: string;
      stroke?: string;
      strokeWidth?: number | string;
    }

    interface HTMLAttributes<T> extends DOMAttributes<T> {
      className?: string;
      style?: CSSProperties;
      id?: string;
      key?: Key;
      ref?: Ref<T>;
      children?: ReactNode;
      dangerouslySetInnerHTML?: { __html: string };
      onClick?: (event: MouseEvent<T>) => void;
      onChange?: (event: ChangeEvent<T>) => void;
      onSubmit?: (event: FormEvent<T>) => void;
      onFocus?: (event: FocusEvent<T>) => void;
      onBlur?: (event: FocusEvent<T>) => void;
      onKeyDown?: (event: KeyboardEvent<T>) => void;
      onMouseEnter?: (event: MouseEvent<T>) => void;
      onMouseLeave?: (event: MouseEvent<T>) => void;
      onError?: (event: any) => void;
      alt?: string;
      src?: string;
      href?: string;
      type?: string;
      name?: string;
      value?: string | number | readonly string[];
      defaultValue?: string | number | readonly string[];
      placeholder?: string;
      disabled?: boolean;
      readOnly?: boolean;
      required?: boolean;
      checked?: boolean;
      defaultChecked?: boolean;
      multiple?: boolean;
      autoFocus?: boolean;
      title?: string;
      role?: string;
      tabIndex?: number;
    }

    interface DOMAttributes<T> {
      children?: ReactNode;
    }

    interface CSSProperties {
      [key: string]: string | number | undefined;
    }

    interface DetailedHTMLProps<E extends HTMLAttributes<T>, T> {
      ref?: Ref<T>;
    }

    type HTMLProps<T> = HTMLAttributes<T>;

    namespace JSX {
      interface Element extends ReactElement<any, any> {}
      interface ElementClass extends Component<any, any> {}
      interface ElementAttributesProperty { props: {}; }
      interface ElementChildrenAttribute { children: {}; }

      interface IntrinsicElements {
        div: HTMLAttributes<HTMLDivElement>;
        span: HTMLAttributes<HTMLSpanElement>;
        p: HTMLAttributes<HTMLParagraphElement>;
        a: HTMLAttributes<HTMLAnchorElement>;
        button: HTMLAttributes<HTMLButtonElement>;
        input: HTMLAttributes<HTMLInputElement>;
        select: HTMLAttributes<HTMLSelectElement>;
        option: HTMLAttributes<HTMLOptionElement>;
        textarea: HTMLAttributes<HTMLTextAreaElement>;
        form: HTMLAttributes<HTMLFormElement>;
        label: HTMLAttributes<HTMLLabelElement>;
        img: HTMLAttributes<HTMLImageElement>;
        table: HTMLAttributes<HTMLTableElement>;
        thead: HTMLAttributes<HTMLTableSectionElement>;
        tbody: HTMLAttributes<HTMLTableSectionElement>;
        tr: HTMLAttributes<HTMLTableRowElement>;
        th: HTMLAttributes<HTMLTableHeaderCellElement>;
        td: HTMLAttributes<HTMLTableCellElement>;
        h1: HTMLAttributes<HTMLHeadingElement>;
        h2: HTMLAttributes<HTMLHeadingElement>;
        h3: HTMLAttributes<HTMLHeadingElement>;
        h4: HTMLAttributes<HTMLHeadingElement>;
        ul: HTMLAttributes<HTMLUListElement>;
        ol: HTMLAttributes<HTMLOListElement>;
        li: HTMLAttributes<HTMLLIElement>;
        header: HTMLAttributes<HTMLElement>;
        main: HTMLAttributes<HTMLElement>;
        aside: HTMLAttributes<HTMLElement>;
        nav: HTMLAttributes<HTMLElement>;
        section: HTMLAttributes<HTMLElement>;
        article: HTMLAttributes<HTMLElement>;
        footer: HTMLAttributes<HTMLElement>;
        svg: SVGAttributes<SVGSVGElement>;
        circle: SVGAttributes<SVGCircleElement>;
        path: SVGAttributes<SVGPathElement>;
        rect: SVGAttributes<SVGRectElement>;
        line: SVGAttributes<SVGLineElement>;
        polyline: SVGAttributes<SVGPolylineElement>;
        polygon: SVGAttributes<SVGPolygonElement>;
        text: SVGAttributes<SVGTextElement>;
        g: SVGAttributes<SVGGElement>;
        defs: SVGAttributes<SVGDefsElement>;
        linearGradient: SVGAttributes<SVGLinearGradientElement>;
        stop: SVGAttributes<SVGStopElement>;
        clipPath: SVGAttributes<SVGClipPathElement>;
        [elemName: string]: any;
      }
    }
  }
}

declare module 'react/jsx-runtime' {
  export { jsx, jsxs, Fragment } from 'react';
}

declare module 'react-dom' {
  import * as React from 'react';

  export function createRoot(container: Element | DocumentFragment): {
    render(element: React.ReactNode): void;
    unmount(): void;
  };

  export function hydrateRoot(container: Element | DocumentFragment, initialChildren: React.ReactNode): {
    render(element: React.ReactNode): void;
    unmount(): void;
  };
}
