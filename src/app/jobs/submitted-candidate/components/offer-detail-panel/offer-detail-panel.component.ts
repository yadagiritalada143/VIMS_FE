import { Component, OnInit } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offer-detail-panel',
  templateUrl: './offer-detail-panel.component.html',
  styleUrls: ['./offer-detail-panel.component.scss']
})
export class OfferDetailPanelComponent implements OnInit {
  detailsPanel = 'hidden';
  public offerDetailForm: UntypedFormGroup;
  private subscriptions = [];

  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder
  ) { }

  ngOnInit(): void {
    this.offerDetailForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      rate: [null, Validators.required],
      manager: [null, ''],
      oldRate: [null, ''],
    });
    this.subscriptions.push(this.eventStream.on(Events.OFFER_DETAIL_PANEL).subscribe((data) => {
      if (data.value) {
        this.detailsPanel = 'visible';
        this.offerDetailForm.patchValue({
          startDate: data.data.startDate,
          endDate: data.data.endDate
        })
      }
    }));
  }
  saveDetails() {
    this.sidebarClose();
  }
  sidebarClose() {
    let data = this.offerDetailForm.value;
    this.detailsPanel = 'hidden';
    this.eventStream.emit(new EmitEvent(Events.OFFER_DETAIL_PANEL, { value: false, data: data, type: 'counter' }));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
