import { Directive, Input, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { I18NextPipe } from 'angular-i18next';

@Directive({
  selector: '[tooltip]'
})
export class TooltipDirective {
  @Input('tooltip') tooltipTitle: string;
  @Input() placement: string;
  @Input() delay;
  @Input() textAlignment;
  @Input() visibility;
  @Input() size;
  tooltip: HTMLElement;
  offset = 10;

  constructor(private el: ElementRef, private renderer: Renderer2, private i18NextPipe: I18NextPipe) { }
  ngAfterViewInit() {
    if (this.tooltip) {
      this.hide();
    }
  }
  ngOnDestroy(): void {
    if (this.tooltip) { this.hide(); }
  }
  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltip) { this.show(); }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) { this.hide(); }
  }

  @HostListener('click') onClick() {
    if (this.tooltip) { this.hide(); }
  }

  @HostListener('mousewheel', ['$event']) onScroll(e) {
    if (this.tooltip) { this.hide(); }
  }

  show() {
    if(this.tooltipTitle){
      this.create();
      this.setPosition();
      this.renderer.addClass(this.tooltip, 'ng-tooltip-show');
    }

  }

  hide() {
    this.renderer.removeClass(this.tooltip, 'ng-tooltip-show');
    window.setTimeout(() => {
      if (this.tooltip) {
        this.renderer.removeChild(document.body, this.tooltip);
        this.tooltip = null;
      }
    }, this.delay);
  }

  create() {
    this.tooltip = this.renderer.createElement('span');
    this.renderer.appendChild(
      this.tooltip,
      this.renderer.createText(this.i18NextPipe?.transform(this.tooltipTitle)) // textNode
    );

    this.renderer.appendChild(document.body, this.tooltip);

    this.renderer.addClass(this.tooltip, 'ng-tooltip');
    this.renderer.addClass(this.tooltip, `ng-tooltip-${this.placement}`);

    this.renderer.setStyle(this.tooltip, 'visibility', this.visibility);
    this.renderer.setStyle(this.tooltip, 'text-align', this.textAlignment);
    this.renderer.setStyle(this.tooltip, '-webkit-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, '-moz-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, '-o-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, 'transition', `opacity ${this.delay}ms`);

    if (this.size === 'large') {
      this.renderer.addClass(this.tooltip, 'large');
    }
  }

  setPosition() {
    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltip.getBoundingClientRect();
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const pageZoom = this.el.nativeElement.closest(".create-form");
    const screenWidth = window.innerWidth;

    let top, left;

    if (this.placement === 'top') {
      top = hostPos.top - tooltipPos.height - this.offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (this.placement === 'bottom') {
      top = hostPos.bottom + this.offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (this.placement === 'left') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.left - tooltipPos.width - this.offset;
    }

    if (this.placement === 'right') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.right + this.offset;
    }

    if(pageZoom && (screenWidth > 1440)) {
      top = top * 1.17;
      left = left * 1.17;
    }

    this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }
}
