import { AfterViewChecked, Directive, ElementRef, Inject,  OnDestroy } from '@angular/core';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';
import { Subscription} from 'rxjs';

@Directive({
  selector: '[I18n]'
})
export class I18nDirective implements AfterViewChecked, OnDestroy {
  private languageKey: string;
  private lastParams: any;
  private currentParams: any;
  private onLangChangeSub: Subscription;
  private onDefaultLangChangeSub: Subscription;
  private onTranslationChangeSub: Subscription;

  constructor(@Inject(I18NEXT_SERVICE) private i18NextService: ITranslationService, private element: ElementRef, ) {
    if (this.element?.nativeElement?.tagName == "INPUT") {
      this.element?.nativeElement?.setAttribute("originalContent", this.element?.nativeElement?.placeholder);
    }
    if (!this.onTranslationChangeSub) {
      this.onTranslationChangeSub = this.i18NextService?.events?.languageChanged.subscribe((event: any) => {
        if (event?.lang === this.i18NextService?.language) {
          this.checkNodes(true, event?.translations);
        }
      });
    }
    if (!this.onLangChangeSub) {
      this.onLangChangeSub = this.i18NextService?.events?.languageChanged.subscribe((event: any) => {
        this.checkNodes(true, event?.translations);
      });
    }

    // // subscribe to onDefaultLangChange event, in case the default language changes
    // if (!this.onDefaultLangChangeSub) {
    //   this.onDefaultLangChangeSub = this.translateService.onDefaultLangChange.subscribe((event: DefaultLangChangeEvent) => {
    //     this.checkNodes(true);
    //   });
    // }
  }

  ngAfterViewChecked() {
    this.checkNodes();
  }

  checkNodes(forceUpdate = false, translations?: any) {
    let nodes: NodeList = this.element?.nativeElement?.childNodes;
    // if the element is empty
    if (!nodes?.length) {
      // we add the key as content
      this.setContent(this.element?.nativeElement, this.languageKey);
      nodes = this.element?.nativeElement?.childNodes;
      if (this.element?.nativeElement?.tagName == "INPUT") {
        this.updatePlaceholder(this.element?.nativeElement);
      }
    }
    nodes = this.getDiv(nodes);
    for (let i = 0; i < nodes?.length; ++i) {
      let node: any = nodes[i];
      if (node.nodeType === 3) {
        let key: string;
        if (forceUpdate) {
          node.lastKey = null;
        }
        if (this.isDefined(node?.lookupKey)) {
          key = node?.lookupKey ?? '';
        } else if (this.languageKey) {
          key = this.languageKey;
        } else {
          let content = this.getContent(node) ?? '';
          let trimmedContent = content.trim();
          if (trimmedContent?.length) {
            node.lookupKey = trimmedContent;
            if (content !== node?.currentValue) {
              key = trimmedContent;
              node.originalContent = content || node?.originalContent;
            } else if (node?.originalContent) {
              key = node?.originalContent.trim();
            } else if (content !== node?.currentValue) {
              key = trimmedContent;
              node.originalContent = content || node?.originalContent;
            }
          }

        }
        this.updateValue(key, node);
      }
    }
  }

  updateValue(key: string, node: any) {
    if (key) {
      if (node.lastKey === key && this.lastParams === this.currentParams) {
        return;
      }
      this.lastParams = this.currentParams;

      

      // if (this.isDefined(translations)) {
      //   let res = this.translateService.getParsedResult(translations, key, this.currentParams);
      //   if (isObservable(res)) {
      //     res.subscribe(onTranslation);
      //   } else {
      //     onTranslation(res);
      //   }
      // } else {
      //  this.translateService.get(key, this.currentParams).subscribe(onTranslation);
      // }
    }
  }

  getContent(node: any): string {
    return this.isDefined(node?.textContent) ? node?.textContent : node?.data;
  }

  setContent(node: any, content: string): void {
    if (this.isDefined(node?.textContent)) {
      node.textContent = content;
      if (this.element?.nativeElement?.tagName == "INPUT") {
        this.element.nativeElement.placeholder = content;
      }
    } else {
      node.data = content;
    }
  }

  updatePlaceholder(node) {
    let key = node?.placeholder;
    let originalContent = node.getAttribute('originalcontent');
    if (key) {
      if (originalContent === key && this.lastParams === this.currentParams) {
        return;
      }
      this.lastParams = this.currentParams;
     
      // if (this.isDefined(translations)) {
      //   let res = this.translateService.getParsedResult(translations, key, this.currentParams);
      //   if (isObservable(res)) {
      //     res.subscribe(onTranslation);
      //   } else {
      //     onTranslation(res);
      //   }
      // } else {
      //   this.translateService.get(key, this.currentParams).subscribe(onTranslation);
      // }
    }
  }

  ngOnDestroy() {
    if (this.onLangChangeSub) {
      this.onLangChangeSub.unsubscribe();
    }

    if (this.onDefaultLangChangeSub) {
      this.onDefaultLangChangeSub.unsubscribe();
    }

    if (this.onTranslationChangeSub) {
      this.onTranslationChangeSub.unsubscribe();
    }
  }

  isDefined(value: any): boolean {
    return typeof value !== 'undefined' && value !== null;
  }

  getDiv(node) {
    let nodes = this.element?.nativeElement?.querySelectorAll('div');
    if (nodes && nodes?.length == 4 && nodes[2]?.className == "ng-placeholder") {
      return nodes[2]?.childNodes;
    }
    else return node;
  }
}
