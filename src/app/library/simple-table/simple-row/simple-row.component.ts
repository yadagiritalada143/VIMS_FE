import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigTypes, CurrencyConfig }  from 'src/app/expense/enums/accuracy-config.enum';
@Component({
  selector: 'app-simple-row',
  templateUrl: './simple-row.component.html',
  styleUrls: ['./simple-row.component.scss'],
})
export class SimpleRowComponent implements OnInit, OnDestroy {
  @Input() isVmsTableExpand = false;
  @Input() index: any;
  @Input() vmsRowDataSource: any;
  @Input() isImage = false;
  @Input() isContact = false;
  @Input() isVieworEdit = false;
  @Input() isDelete = false;
  @Input() isNoOption = false;
  @Input() isFIle: boolean;
  @Input() permission: string;
  @Input() isIcon = false;
  @Input() isCurrency: boolean;
  @Input() isDescription: boolean;

  @Output() viewClicked = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();
  @Output() editClicked = new EventEmitter();
  @Output() onOpenPanel = new EventEmitter();

  @ViewChild('optionButton', { read: ElementRef, static: false }) optionButton: ElementRef;

  isObjectElementBig = false;
  public fullText = false;
  showdropdown = false;
  showdropdownFirstCol = false;

  private subscriptions = [];
  public viewCurrencyStrict: string = '0.4-4' ;
  public accuracyConfig = AccuracyConfigTypes;
  public currencyConfig = CurrencyConfig;
  constructor(private eventStream: EventStreamService, public _storageService: StorageService , public currencyPipe: CustomcurrencyPipe, public accuracyPipe: AccuracyPipe) {
    // const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
    // this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
  }

  ngOnInit(): void {
    if (this.isObject() === 'object' && this.vmsRowDataSource) {
      const converArr = [this.vmsRowDataSource];
      this.isObjectElementBig = converArr.some(ele => ele && ele.length > 2);
    }
    this.subscriptions.push(
      this.eventStream.on(Events.OPTION_DROPDOWN).subscribe(data => {
        if (data) {
          this.showdropdown = false;
        }
      }),
    );
  }
  showTooltip(val,currency) {
    // return this.currencyPipe?.transform(val, undefined, undefined, this.viewCurrencyStrict, undefined, true);
    // return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT);
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    if(currentProgram?.config['accuracy_config']){
      return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT,{ currencyCode: currency });
    } else{
      return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT, { currencyCode: currency, digitInfo: this.viewCurrencyStrict});
    }
  }
  public isObject() {
    return typeof this.vmsRowDataSource;
  }

  public clickToView() {
    this.viewClicked.emit(true);
  }

  public clickTodelete() {
    this.deleteClicked.emit(true);
  }

  public clickToEdit() {
    this.editClicked.emit(true);
  }

  public openPanel() {
    this.onOpenPanel.emit(true);
  }

  public openPreview(fileDetails) {
    if (fileDetails.hasBigPreview) {
      this.onOpenPanel.emit(fileDetails);
    } else {
      window.location.href = fileDetails.downloadPath;
    }
  }

  ShowFUll() {
    this.fullText = true;
  }

  ShowLess() {
    this.fullText = false;
  }

  showOptionDropdown() {
    this.showdropdown = true;
  }

  showDropdownFirstCol() {
    this.showdropdownFirstCol = true;
    const itemPosition = this.optionButton.nativeElement.getBoundingClientRect();
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, itemPosition));
  }

  hideDropdownFirstCol() {
    this.showdropdownFirstCol = false;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
