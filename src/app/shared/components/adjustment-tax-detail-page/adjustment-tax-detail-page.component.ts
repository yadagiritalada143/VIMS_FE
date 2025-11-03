import { Component, OnInit, Input } from '@angular/core';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-adjustment-tax-detail-page',
  templateUrl: './adjustment-tax-detail-page.component.html',
  styleUrls: ['./adjustment-tax-detail-page.component.scss']
})
export class AdjustmentTaxDetailPageComponent implements OnInit {

  @Input() taxData;
  @Input() adjustmentData;
  @Input() currency;
  programDetails:any;
  taxAllowed: boolean = false;
  viewTax: boolean = false;
  adjustmentAllowed: boolean = false;
  viewAdjustment: boolean = false;
  constructor(
    private storageService : StorageService,
    private authorizationService : AuthorizationService,
  ) { }

  ngOnInit(): void {
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.taxAllowed = this.programDetails?.config?.is_custom_tax_on_assignment;
    this.viewTax = this.authorizationService.authorize('view_tax');
    this.adjustmentAllowed = this.programDetails?.config?.is_adjustment_fee_allowed;
    this.viewAdjustment = this.authorizationService.authorize('view_adjustment');
  }

  removeSymbol(value) {
    return value?.slice(1);
  }
}
