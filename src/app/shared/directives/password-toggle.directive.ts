import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appPasswordToggle]'
})
export class PasswordToggleDirective {
  private _shown = true;

  constructor(private el: ElementRef) {
    const parent = this.el.nativeElement.parentNode;
    const divElm = document.createElement('div');
    divElm.classList.add("showhide");
    divElm.innerHTML = '<i class="material-icons visibility-icon" >visibility_off</i>';
    divElm.addEventListener('click', () => {
      this.passwordToggle(divElm);
    });
    parent.appendChild(divElm);
  }

  passwordToggle(span: HTMLElement) {
    if (this._shown) {
      this.el.nativeElement.setAttribute('type', 'text');
      span.innerHTML = '<i class="material-icons visibility-icon" >visibility</i>';
      this._shown = false;
    } else {
      this.el.nativeElement.setAttribute('type', 'password');
      span.innerHTML = '<i class="material-icons visibility-icon" >visibility_off</i>';
      this._shown = true;
    }
  }
}
