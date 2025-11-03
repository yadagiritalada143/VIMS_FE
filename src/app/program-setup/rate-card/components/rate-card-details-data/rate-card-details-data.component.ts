import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { MappingService } from '../../mapping-service.service';

@Component({
  selector: 'app-rate-card-details-data',
  templateUrl: './rate-card-details-data.component.html',
  styleUrls: ['./rate-card-details-data.component.scss']
})
export class RateCardDetailsDataComponent implements OnInit {

  public title = 'Add Rate';
  public currency: string = 'USD';
  public rateCard: any = null;
  public editRateCardVisibility = 'hidden';
  public editFilteredRateId: string = null;

  @Input('rateCard') set cardRates(data: any) {
    if(data) {
      this.rateCard = data;
      this.currency = this.rateCard?.currency;
    }
  };

  @Input() job: any;
  @Input() addRateVisibility = 'hidden';
  @Input() jobTemplateDisabled: boolean = true;

  @Output() onUpdateData = new EventEmitter();
  @Output() onClose = new EventEmitter();
  
  public templateSelected: string = null;
  @Input('templateSelected') set selectedTemplate(data: string) {
    if(data) {
      this.templateSelected = data;
      this.rateList = this.chainedTemplates.get(data);
    } else {
      this.templateSelected = null;
    }
  }

  public rateList: Array <any> = [];
  public chainedTemplates: Map <string, Array <any>> = null;
  @Input('chainedTemplates') set chainedTemplateList(data: Map <string, Array <any>>) {
    if(data) {
      this.chainedTemplates = data;
    }
  };


  constructor (
    private eventStream: EventStreamService,
    public mapper: MappingService
  ) { }

  ngOnInit(): void { }

  onCreateClick(event) {
    this.title = 'Add Rate';
    this.addRateVisibility = 'visible';
    setTimeout(() => {
      this.eventStream.emit(
        new EmitEvent(
          Events.ADD_RATE_DETAILS,
          null
        ));
    }, 800);
  }

  ngOnChanges() {
    if(this.chainedTemplates) {
      this.rateList = this.chainedTemplates.get(this.templateSelected);
    }
  }

  onCloseAddRate(event) {
    this.addRateVisibility = 'hidden';
    this.onClose.emit(true);
  }

  onUpdate(event) {
    this.onUpdateData.emit(event);
  }

  onEdit(id: string) {
    this.editFilteredRateId = id;
    this.title = 'Edit Rate';
    this.editRateCardVisibility = 'visible';
  }

  onCloseEditRate() {
    this.editRateCardVisibility = 'hidden';
    this.editFilteredRateId = null;
  }

  onRateUpdate(event) {
    this.onUpdateData.emit(event);
    this.editRateCardVisibility = 'hidden';
  }
}