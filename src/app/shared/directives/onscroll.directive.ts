import { Directive,  HostListener} from '@angular/core';

@Directive({
  selector: '[appOnscroll]'
})
export class OnscrollDirective {
  @HostListener('window:scroll',['$event'])  onScroll(e) {
    const shadowTrigger = document.querySelector(".c-content");
    if(shadowTrigger) {
      if(e.target['scrollingElement'].scrollTop > 0) {
        shadowTrigger.classList.add('shadow-enabled');
      }
      else {
        shadowTrigger.classList.remove('shadow-enabled');
      }
    }
    
    const titles = document.querySelectorAll(".sticky-header");
    if(titles) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if(entry.boundingClientRect.top < 162) {
            entry.target.classList.add('stuck')
          }
          else if(entry.boundingClientRect.top > 161) {
            entry.target.classList.remove('stuck')
          }
        })
      });

      titles.forEach(title => {
        observer.observe(title)
      })
    } 
  }
}
