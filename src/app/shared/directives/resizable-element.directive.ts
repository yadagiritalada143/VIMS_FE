import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appResizableElement]',
})
export class ResizableElementDirective {
  constructor(private el: ElementRef) {}
  ngAfterViewInit() {
    const dragContainer = this.el.nativeElement;
    const rightElem = dragContainer.querySelector('.column-right');
    const handle = dragContainer?.querySelectorAll('.drag-handle');
    handle?.forEach(function (e) {
      e.addEventListener('mousedown', f => {
        f.target.classList.add('dragging');
      });
    });

    document.addEventListener('mousemove', g => {
      const draggingElm = document.getElementsByClassName('dragging');
      if (draggingElm.length > 0) {
        var offsetRight = dragContainer.clientWidth - (g.clientX - dragContainer.getBoundingClientRect().left);
        rightElem.style.width = offsetRight + 'px';
      } else {
      }
    });

    document.addEventListener('mouseup', h => {
      const draggingItem = dragContainer.querySelectorAll('.dragging');
      draggingItem?.forEach(function (i) {
        i.classList.remove('dragging');
      });
    });
  }
}
