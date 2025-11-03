import { EventStreamService } from 'src/app/core/services/event-stream.service';
import { EmitEvent, Events } from './../../../core/services/event-stream.service';
import { BASIC_FIELD_TYPES } from './../../../shared/enums';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { StorageService } from '../../../core/services/storage.service';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-property-editor',
  templateUrl: './property-editor.component.html',
  styleUrls: ['./property-editor.component.scss']
})
export class PropertyEditorComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public status;
  public programId: any;
  public toggle = { value: true };
  private pageNo = 0;
  private limit = 25;
  public tableLoaded = false;
  public rolesData: any;
  public selected_pickList_id: any;
  public totalPages = 0;
  public totalRecords = 0;
  public itemsPerPage: any;
  public currencyType = [];
  public tempFields = [];
  public pickListData: any = []; 
  public values = [{}];
  public showPickListName: boolean = false;
  public isCreatePickList: boolean = true;
  public pickList: any = {};
  public isSubmitted: boolean = false;
  public sizeList = Array(20).fill(0).map((x, i) => i + 1);
  @Input() public roleList: any[] = [];
  @Output() closePropertyEditor = new EventEmitter();
  public fieldProperties: any = {
    meta_data: {
      options: {}
    }
  };
  baseModel: any = {};
  public fieldTypes: any = BASIC_FIELD_TYPES;
  selectedRole: boolean = false;
  /* get field(): any {
    return this.fieldProperties;
  }

  @Input() set field(value: any) {
    this.updatePropertiesEvent();
    if (value) {
      this.fieldProperties = value;
      this.baseModel = this.tempFields.find(e => e.type == this.fieldProperties.type)
    }
  } */
  supportedFileType = [
    'image/*',
    'image/png',
    'image/jpeg',
    'audio/*',
    'video/*'
  ];

  constructor(private eventStream: EventStreamService,
    private _programService: ProgramService,
    private userService: UserService,
    private _storageService: StorageService,
    private _loader: LoaderService,
    private _alert: AlertService) {
    this.currencyType = ['USD', 'GBP', 'EUR'];

    this.tempFields = [{
      type: 'textfield',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text']
      // char limit of 100
    },
    {
      type: 'date',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text', 'range', 'timepicker']
    }, {
      type: 'time',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text']
    },
    {
      type: 'textarea',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text']
      // char limit of 2000
    },
    {
      type: 'currency',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'currency', 'placeholder', 'description', 'validation_text']
      // currently supported formats USD, GBP, EUR
    },
    {
      type: 'email',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text']
    },
    {
      type: 'file',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'allow_multiple', 'file_size', 'file_type']
    },
    {
      type: 'number',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text']
    },
    {
      type: 'toggle',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'toggle', 'placeholder', 'description', 'validation_text']
    },
    {
      type: 'radio',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'radio', 'placeholder', 'description', 'validation_text']
    },
    {
      type: 'checkbox',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'checkbox', 'placeholder', 'description', 'validation_text']
    },
    {
      type: 'hyperlink',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'description', 'validation_text']
    },
    {
      type: 'heading',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'description', 'validation_text']
    },
    {
      type: 'subheading',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'description', 'validation_text']
    },
    {
      type: 'phone',
      sub_type: 'input',
      name: '',
      label: '',
      placeholder: '',
      description: '',
      meta_data: {},
      is_required: true,
      is_enabled: true,
      properties: ['required', 'enabled', 'name', 'label', 'placeholder', 'description', 'validation_text']
    },
    ];
  }

  ngOnInit(): void {
    let programId = this._storageService.get(ProgramConfig[0]);
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
      // this.clientId = programId?.clientId;
    }
    this.getRoleList(this.pageNo = 1);
    this.getpicksList(this.pageNo = 1);
    
    // this.getRoleList(this.pageNo = 1);
    this.subscriptions.push(this.eventStream.on(Events.SELECTED_CUSTOM_FIELD).subscribe((data) => {
      if (data) {
        if (this.fieldProperties && (this.fieldProperties.primary !== data.primary ||
          (this.fieldProperties.primary === data.primary && this.fieldProperties.secondary !== data.secondary))) {
          // this.updatePropertiesEvent();
        }
        this.fieldProperties = data;
        this.baseModel = this.tempFields.find(e => e.type === this.fieldProperties.type);
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CUSTOM_FIELD_PROPERTIES).subscribe( (result) => {
      if (result) {
        const data = result.field;
        if (data && data.primary !== undefined && data.secondary !== undefined) {
          this.fieldProperties = data;
        }
      }

    }));
  }


  loadFrom() {
    this.isCreatePickList = !this.isCreatePickList;
  }

  saveToPickList() {
    this.showPickListName = true;
  }

  selectedRadio(event, prooperty) {
    this.fieldProperties.selectedToggle = event.target.value;
    this.updatePropertiesEvent();
  }
  removeMoreOption(i) {
    if (this.values.length > 1) {
      this.values.splice(i, 1);
      this.updatePropertiesEvent();
    }
  }
  addMoreOption() {
    this.values.push({});
    this.updatePropertiesEvent();
  }

  getRoleList(pageNo = 1) {
    // this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.subscriptions.push(this.userService.getAllRoleList(this.programId, this.pageNo, this.limit).subscribe(data => {
      // this.rolesData = data.roles;
      this.roleList = data.roles.map(rol => {
        return { name: rol.name, id: rol.id, selected: false };
      });
      this.fieldProperties.roles = this.roleList;
      this._loader.hide();
    }, error => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
    },
      () => {
        // this.dataLoading = false;
        this._loader.hide();
      }));
  }
  getpicksList(pageNo = 1) {
    if (pageNo === 1) {
      this._loader.show();
    }
    this.subscriptions.push(this.userService.getAllpicksList(this.programId, pageNo, this.limit).subscribe(data => {
      this.pickListData = data.picklists;
      this.totalRecords = data.total_records;
      this.itemsPerPage = data.items_per_page;
      this.tableLoaded = true;
      this._loader.hide();
    }, error => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
    }));
  }

  savePicklist() {
    this.isSubmitted = true;
    this.pickList.is_enabled = true;
    if (this.pickList.name) {
      const payload = {
        name: this.pickList.name,
        is_enabled: this.pickList.is_enabled
      };
      this._loader.show();
      this.subscriptions.push(this._programService.post(`/configurator/programs/${this.programId}/picklists`, payload).subscribe(
        data => {
          if (data) {
            this.pickList.name = '';
            this.values = [];
            this._alert.success(`New Picklist Created Succesfully`);
          }
          this._loader.hide();
        },
        (err) => {
          this.isSubmitted = false;
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }));
    } else {
      this.isSubmitted = false;
      this._alert.error("PickList Name is not available!");
    }
  }

  onClickToggle(toggle) {
    this.fieldProperties[toggle] = !this.fieldProperties[toggle];
    this.updatePropertiesEvent();
  }
  onMetaClickToggle(toggle) {
    this.fieldProperties.meta_data[toggle] = !this.fieldProperties.meta_data[toggle];
    this.updatePropertiesEvent();
  }
  onClickToggleOptions(toggle) {
    // const fieldList =  toggle.split('.');
    // fieldList
    this.fieldProperties.meta_data.options[toggle] = !this.fieldProperties.meta_data.options[toggle];
    this.updatePropertiesEvent();

  }

  goBack() {
    this.updatePropertiesEvent();
    this.closePropertyEditor.emit(true);
  }

 
  addOption(event, data) {
    const d = { value: data } 
    this.fieldProperties.selectedOption.push(d);
    this.updatePropertiesEvent();
    // }
  }
  modelChange(event, property) {
    this.fieldProperties[property] = event.target.value;
    this.updatePropertiesEvent();
  }

  metaDataModelChange(event, property) {
    this.fieldProperties.meta_data[property] = (property === 'file_size' || property === 'file_type') ? event : event.target.value;
    this.updatePropertiesEvent();
  }

  currencyChange(event, property) {
    this.fieldProperties[property] = event;
    this.updatePropertiesEvent();
  }
  updatePropertiesEvent() {
    this.eventStream.emit(new EmitEvent(Events.UPDATE_CUSTOM_FIELD_PROPERTIES, { field: this.fieldProperties, origin: 'property-editor' }));
  }
  onClickToggles() {
    if (this.toggle.value) {
      this.toggle.value = false;
    } else {
      this.toggle.value = true;
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}


