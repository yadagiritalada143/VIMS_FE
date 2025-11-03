import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
    selector: 'app-contract-ending-widget',
    templateUrl: './contract-ending-widget.component.html',
    styleUrls: ['./contract-ending-widget.component.scss']
})
export class ContractEndingWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
        this.initWidget();
    }
}
