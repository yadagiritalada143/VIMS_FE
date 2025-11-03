import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { NotificationConfigService } from 'src/app/program-setup/notification-config/notification-config.service';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder.service';

@Component({
  selector: 'app-item-properties',
  templateUrl: './item-properties.component.html',
  styleUrls: ['./item-properties.component.scss']
})
export class ItemPropertiesComponent implements OnInit {
  exts = 'png, jpg, gif';
  @Input() propertyName: string;
  @Input() isOpen = false;
  @Output() clickClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  selectedItem:any;
  templateKeys: any;

  // selectedRow: any;
  // selecteCol: any;

  constructor(public dynamicHtmlTemplateBuilderService:DynamicHtmlTemplateBuilderService,private notificationConfigService: NotificationConfigService) {
  }

  ngOnInit(): void {
    this.propertyName=null;
    console.log(this.propertyName);
    // this.selectedRow = this.dynamicHtmlTemplateBuilderService.selectedRow;
    // this.selecteCol = this.dynamicHtmlTemplateBuilderService.selecteCol;
    this.dynamicHtmlTemplateBuilderService.selectedItem.subscribe((item:any)=>{
      if(!item) {
        this.isOpen = false;
        return;
      }
      this.selectedItem=item;
      this.selectedItem.customProperties = {...(this.selectedItem?.customProperties || {}), target: ''};
      this.propertyName = item.type;
      if(item){
        this.isOpen = true;
        this.selectedItem.styles.length==0 && this.selectedItem?.styles.push({key:'',value:''});
      }
      this.getTemplateKeys();
    })
  }

  getTemplateKeys() {
    const eventData = JSON.parse(localStorage.getItem('eventData'));
    if (eventData?.eventCode) {
      this.notificationConfigService.getTemplateKeys(eventData?.eventCode, false).subscribe((response: any) => {
        this.templateKeys = (response?.template_fields_mappings || [])?.sort((a,b) => (a?.field_name > b?.field_name) ? 1 : ((b?.field_name > a?.field_name) ? -1 : 0));
      });
    }
  }

  keySelected(value) {
    navigator.clipboard.writeText(`{{${value.field_slug}}}`).then().catch(e => console.error(e));
  }

  uploadImage($event) {
    let element = $event.target;
    var file = element.files[0];
    var reader = new FileReader();
    reader.onloadend = () => {
      console.log('RESULT', reader.result);
      this.selectedItem.base64Data = reader.result;
      this.selectedItem.componentRef.applyStyles(this.selectedItem);
    }
    reader.readAsDataURL(file);
  }

  onFileDropped(files: Array<any>) {
    this.uploadImage({
      target: {
        files: files,
      },
    });
  }

  closeElemProperty() {
    this.propertyName = null;
    this.isOpen = false;
    this.clickClose.emit(false);
  }

  logStyles() {
    console.log(this.selectedItem);
    this.selectedItem.componentRef.applyStyles(this.selectedItem);
    this.dynamicHtmlTemplateBuilderService.selecteCol.componentRef.applyStyles();
    this.dynamicHtmlTemplateBuilderService.selectedRow.componentRef.applyStyles();


  }

  customSearchFn(term: string, item: any) {

    let filednameMatch = false, fieldSlugMatch = false;
    if(item.field_name) {
      filednameMatch = item.field_name.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) > -1;
    }

    if(item.field_slug) {
      fieldSlugMatch = item.field_slug.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) > -1;
    }
    return filednameMatch || filednameMatch;
  }
}
