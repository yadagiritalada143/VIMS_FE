import { Component, Input, OnChanges, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-custom-html',
  templateUrl: './custom-html.component.html',
  styleUrls: ['./custom-html.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class CustomHtmlComponent implements OnChanges {

  @ViewChild('renderRoot') renderRoot;
  @Input() innerHtml;
  constructor() { }

  ngOnChanges(): void {
    this.applyChanges();
  }

  ngOnAfterViewInit(): void {
    this.applyChanges();
  }

  applyChanges() {
    setTimeout(() => {
      if(this.innerHtml && this.renderRoot) {
        this.renderRoot.nativeElement.innerHTML = this.innerHtml;
      }
    })
  }

}
