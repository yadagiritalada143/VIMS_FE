import { Directive, Input } from '@angular/core';
import { UrlService } from '../service/url.service';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[hyperlink]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: HyperlinkDirective,
    multi: true
  }]
})
export class HyperlinkDirective implements Validator {

  @Input('hyperlink') arguments: Array <any> = [];

  constructor(
    private urlService: UrlService,
  ) { }

  validate(control: AbstractControl): ValidationErrors | null {

    let validation: boolean = true;
    const value: string = control?.value || '';
    const protocolPresent: boolean = (value.indexOf("://") > 0);
    
    if(protocolPresent) {
      validation = this.urlService.isURLValid(value);
    } else {
      validation = this.urlService.isURLValid(value, true, 'https');
    }

    return validation ? null : {
      'invalid_url': value
    };
  }
}
