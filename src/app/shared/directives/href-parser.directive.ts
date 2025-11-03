import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[hrefParse]'
})
export class HrefParserDirective {

  @Input('hrefParse') set hyperlinkParsed(url: string) {

    const element: HTMLElement = this.elementRef?.nativeElement;
    
    // Apply following attributes only for anchor HTML element(s)
    if(element?.tagName === 'A') {
      element.setAttribute('href', this.urlParser(url));
      element.setAttribute('rel', 'noopener');
    }
  }

  constructor(private elementRef: ElementRef) { }

  // Handling URL paths irrespective of protocol provided
  urlParser(url: string) {

    url = url || "";
    if (url.includes("://")) {
      return url;
    }

    return "//" + url;
  }
}
