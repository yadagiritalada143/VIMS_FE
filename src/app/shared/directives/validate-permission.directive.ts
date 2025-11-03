import { Directive, OnInit, TemplateRef, ViewContainerRef, Input } from '@angular/core';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Directive({
  selector: '[authorize]',
})
export class AuthorizeDirective implements OnInit {
  permission: string;
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService,
  ) {}

  @Input() set authorize(permission: string) {
    this.permission = permission;
  }

  ngOnInit() {
    const result = this.authorizationService.authorize(this.permission);
    if (result) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
