import { Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Directive({
  selector: '[accessControl]'
})
export class AccessControlDirective implements OnInit {
  constructor(
    private accessControlService: AccessControlService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) { }

  ngOnInit() {
    const result = this.accessControlService.accessControl()
    if (result) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

}
