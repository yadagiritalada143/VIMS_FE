import { Directive, ElementRef, AfterViewInit, HostListener, Input, SimpleChange } from '@angular/core';

@Directive({
  selector: '[appResponsiveMenu]',
})
export class ResponsiveMenuDirective implements AfterViewInit {
  navContainer;
  thisElementClicked: boolean = false;
  @Input() dataLoaded:any;
  primaryWidth: number;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.navContainer = this.el.nativeElement;
    const primary = this.navContainer?.querySelector('.primary');
    const primaryItems = this.navContainer?.querySelectorAll('.primary > li:not(.more)');
    const secondary = this.navContainer?.querySelector('.secondary ul');
    const secondaryItems = secondary?.querySelectorAll('li');
    const allItems = this.navContainer?.querySelectorAll('li');
    const moreLi = primary?.querySelector('.more');
    const moreBtn = moreLi?.querySelector('a');
    const closeBtn = moreLi?.querySelector('.nav-close-btn a');

    moreBtn?.addEventListener('click', e => {
      e.preventDefault();
      this.navContainer?.classList.toggle('show-secondary');
      moreBtn.setAttribute('aria-expanded', this.navContainer.classList.contains('show-secondary'));
    });

    closeBtn?.addEventListener('click', e => {
      e.preventDefault();
      this.navContainer?.classList.remove('show-secondary');
    });

    secondaryItems?.forEach(function(e) {
      const secondarLink = moreLi.querySelector('.nav-close-btn');
      if(secondarLink) {
        secondarLink.addEventListener('click', f => {
          if(f) {
            f.path[5]?.classList?.remove('show-secondary');
            doAdapt();
          }
        })
      }
      else {
        e.addEventListener('click', g => {
          if(g) {
            const  navMainWrap = document.getElementsByClassName("show-secondary");
            navMainWrap[0].classList?.remove('show-secondary');
            doAdapt();
          }
        })
      }
    });

    // adapt tabs

    const doAdapt = () => {
      // reveal all items for the calculation
      allItems.forEach(item => {
        item?.classList.remove('hidden');
      });

      // hide items that won't fit in the Primary
      let stopWidth = moreBtn?.offsetWidth;
      let hiddenItems = [];
      const documentWidth = document.documentElement.clientWidth;
      if(documentWidth > 767) {
        this.primaryWidth = primary?.offsetWidth - 250;
      }
      else {
        this.primaryWidth = primary?.offsetWidth - 80;
      }
      
      primaryItems.forEach((item, i) => {
        if (this.primaryWidth >= stopWidth + item.offsetWidth) {
          stopWidth += item.offsetWidth;
        } else {
          stopWidth += item.offsetWidth;
          const index = i;
          item?.classList?.add('hidden');
          hiddenItems?.push(index);
        }
      });

      // toggle the visibility of More button and items in Secondary
      if (!hiddenItems?.length) {
        moreLi?.classList?.add('hidden');
        moreBtn?.setAttribute('aria-expanded', false);
      } else if (hiddenItems?.length === 1) {
        secondaryItems.forEach((item, i) => {
          if (i < hiddenItems[0]) {
            item?.classList?.add('hidden');
          }
        });
      } else {
        secondaryItems.forEach((item, i) => {
          if (!hiddenItems?.includes(i)) {
            item?.classList?.add('hidden');
          }
        });
      }

      secondaryItems?.forEach(item => {
        let activeItem = item?.classList.contains('active-tab');
        let hiddenItem = item?.classList.contains('hidden');
        let anchoritem = item?.querySelector('a');
        if (!hiddenItem) {
          if (anchoritem) {
            let activeanchor = anchoritem?.classList.contains('active');
            if (activeanchor) {
              moreLi?.classList.add('has-active-menu');
            }
          } else if (activeItem) {
            moreLi?.classList.add('has-active-menu');
          }
        }
      });
    };

    setTimeout(() => {
      primary?.classList.remove("not-loaded");
      doAdapt() 
    }, 1000);

    // adapt immediately on load
    window.addEventListener('resize', doAdapt); // adapt on window resize
  }

  ngOnChanges(changes:  SimpleChange ) {
    if(changes['dataLoaded'].firstChange == false) {
      this.navContainer = this.el.nativeElement;
      const primary = this.navContainer?.querySelector('.primary');
      const primaryItems = this.navContainer?.querySelectorAll('.primary > li:not(.more)');
      const secondary = this.navContainer?.querySelector('.secondary ul');
      const secondaryItems = secondary?.querySelectorAll('li');
      const allItems = this.navContainer?.querySelectorAll('li');
      const moreLi = primary?.querySelector('.more');
      const moreBtn = moreLi?.querySelector('a');

      const doAdapt = () => {
        // reveal all items for the calculation
        allItems.forEach(item => {
          item?.classList.remove('hidden');
        });
  
        // hide items that won't fit in the Primary
        let stopWidth = moreBtn?.offsetWidth;
        let hiddenItems = [];
        const documentWidth = document.documentElement.clientWidth;
        if(documentWidth > 767) {
          this.primaryWidth = primary?.offsetWidth - 250;
        }
        else {
          this.primaryWidth = primary?.offsetWidth - 80;
        }

        primaryItems.forEach((item, i) => {
          if (this.primaryWidth >= stopWidth + item.offsetWidth) {
            stopWidth += item.offsetWidth;
          } else {
            stopWidth += item.offsetWidth;
            const index = i;
            item?.classList?.add('hidden');
            hiddenItems?.push(index);
          }
        });
  
        // toggle the visibility of More button and items in Secondary
        if (!hiddenItems?.length) {
          moreLi?.classList?.add('hidden');
          moreBtn?.setAttribute('aria-expanded', false);
        } else if (hiddenItems?.length === 1) {
          secondaryItems.forEach((item, i) => {
            if (i < hiddenItems[0]) {
              item?.classList?.add('hidden');
            }
          });
        } else {
          secondaryItems.forEach((item, i) => {
            if (!hiddenItems?.includes(i)) {
              item?.classList?.add('hidden');
            }
          });
        }
  
        secondaryItems?.forEach(item => {
          let activeItem = item?.classList.contains('active-tab');
          let hiddenItem = item?.classList.contains('hidden');
          let anchoritem = item?.querySelector('a');
          if (!hiddenItem) {
            if (anchoritem) {
              let activeanchor = anchoritem?.classList.contains('active');
              if (activeanchor) {
                moreLi?.classList.add('has-active-menu');
              }
            } else if (activeItem) {
              moreLi?.classList.add('has-active-menu');
            }
          }
        });
      };

      setTimeout(() => {
        primary?.classList.remove("not-loaded");
        doAdapt() 
      }, 1000);
    }
  }

  @HostListener('click', ['$event'])
    onLocalClick(event: Event & {target: Element}) {
     if((event.target.parentNode.parentElement.classList.contains('secondary-item')) || (event.target.parentElement.classList.contains('more'))) {
      this.thisElementClicked = true;
     }
     else {
      this.thisElementClicked = false;
     }
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        if (!this.thisElementClicked) {
            const  navMainWrap = document.getElementsByClassName("show-secondary");
            if(navMainWrap.length) {
              navMainWrap[0]?.classList?.remove('show-secondary');
            }
            else {}
        }
        else {}
        this.thisElementClicked = false;
    }
}