declare module "glightbox" {
  export interface GLightboxOptions {
    selector?: string | null;
    elements?: any[];
    skin?: string;
    openEffect?: string;
    closeEffect?: string;
    slideEffect?: string;
    moreText?: string;
    moreLength?: number;
    closeButton?: boolean;
    touchNavigation?: boolean;
    touchFollowAxis?: boolean;
    keyboardNavigation?: boolean;
    closeOnOutsideClick?: boolean;
    startAt?: number;
    width?: number | string;
    height?: number | string;
    videosWidth?: number | string;
    descPosition?: string;
    loop?: boolean;
    zoomable?: boolean;
    draggable?: boolean;
    dragToleranceX?: number;
    dragToleranceY?: number;
    dragAutoSnap?: boolean;
    preload?: boolean;
    svg?: any;
    cssEfects?: any;
    lightboxHTML?: string;
    slideHTML?: string;
    autoplayVideos?: boolean;
    autofocusVideos?: boolean;
    plyr?: any;
  }

  export interface GLightboxInstance {
    open(node?: any): void;
    openAt(index: number): void;
    close(): void;
    reload(): void;
    destroy(): void;
    prevSlide(): void;
    nextSlide(): void;
    goToSlide(index: number): void;
    insertSlide(slide: any, index?: number): void;
    removeSlide(index: number): void;
    getActiveSlide(): HTMLElement;
    getActiveSlideIndex(): number;
    slidePlayerPlay(index: number): void;
    slidePlayerPause(index: number): void;
    getSlidePlayerInstance(node: any, index: number): void;
    getAllPlayers(): void;
    setElements(elements: any[]): void;
    on(eventName: string, callback: (data: any) => void): void;
    once(eventName: string, callback: (data: any) => void): void;
  }

  export default function GLightbox(options?: GLightboxOptions): GLightboxInstance;
}
