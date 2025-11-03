import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss']
})
export class OfferComponent implements OnInit {
  isCouterOffer: any;
  programID: any;
  payload: any = {};
  currentProgram: any;
  isOfferReview:any;
  showApproval;
  currentOfferApproval;

  constructor(private httpService: HttpService,
    private storageService: StorageService,
    private alertService: AlertService) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programID = this.currentProgram?.id;
    this.isCouterOffer = this.currentProgram.config?.is_counter_offer;
    this.showApproval = this.isCouterOffer ? true : false;
    this.isOfferReview = this.currentProgram.config?.offer?.pending_offer_review;
    this.currentOfferApproval = this.currentProgram?.config?.is_counter_offer_within_budget_approval ? true : false;
  }

  onChange(event) {
    this.showApproval = !this.showApproval;
    let arr = [];
    arr.push(this.payload);
    if(!event) {
    this.payload.is_counter_offer = event;
    this.payload.is_counter_offer_within_budget_approval = event;
    let offer={};
    if (!Object.keys(offer).length) {
      Object.assign(offer, { counter_offer_review: event });
    }
    this.payload.offer = offer;
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, arr).subscribe((res:any) => {
      if(res) {
        this.currentProgram.config.is_counter_offer = event;
        this.currentProgram.config.is_counter_offer_within_budget_approval = event;
        this.currentProgram.config.offer.counter_offer_review = event;
        this.storageService.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
      }
    })
   }
   if(event) {
    this.payload.is_counter_offer = event;
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, arr).subscribe((res:any) => {
      if(res) {
        this.currentProgram.config.is_counter_offer = event;
        this.storageService.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
        this.isCouterOffer = true;
      }
    })
   }
  }

  approval(event){
    let value = event.currentTarget.checked;
    let arr = [];
    arr.push(this.payload);
    this.payload.is_counter_offer_within_budget_approval = value;
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, arr).subscribe((res:any) => {
      if(res) {
        this.currentProgram.config.is_counter_offer_within_budget_approval = value;
        this.storageService.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
      }
    })

  }

  offerReview(event) {
    let dataPayload=[];
    let payload={};
    let offer={};
    if (!Object.keys(offer).length) {
      Object.assign(offer, { pending_offer_review: event });
    }
    payload={'offer':offer};
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res:any) => {
      if (res) {
        this.currentProgram.config.offer.pending_offer_review = event;
        this.storageService.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
      }
    })

  }

  onChangeOfferApproval = (event) => {
    let payload= [{is_approval_for_offers: event}];
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, payload).subscribe((res:any) => {
      if (res) {
        this.currentProgram.config.is_approval_for_offers = event;
        this.storageService.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
      }
    });
  }

  CounterOfferReview(event) {
    let dataPayload=[];
    let payload={};
    let offer={};
    if (!Object.keys(offer).length) {
      Object.assign(offer, { counter_offer_review: event });
    }
    payload={'offer':offer};
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res:any) => {
      if (res) {
        this.currentProgram.config.offer.counter_offer_review = event;
        this.storageService.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
      }
    })
  }

}
