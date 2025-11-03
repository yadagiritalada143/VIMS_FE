import {Component, OnInit, Input,Output,EventEmitter} from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { GlobalConstants } from '../../globalconstants';

@Component({
  selector: 'app-program-configuration',
  templateUrl: './program-configuration.component.html',
  styleUrls: ['./program-configuration.component.scss']
})
export class ProgramConfigurationComponent implements OnInit {

  @Input ('edit') readOnly: boolean = true;
  @Input() configData;
  @Output() configDataChange = new EventEmitter<any>();
  public isViewMode;
  public dateFormat;
  public rateModel;
  public rateBudget;
  public toggles = {
    hide_images: {
      value: true,
      title: 'Hide Candidate Profile Images'
    },
    vendor_neutral_program: {
      value: true,
      title: 'Vendor Neutral Program'
    },
    is_work_location_read_only: {
      value: false,
      title: 'Work Location Read only'
    },
    // allow_multiple_default_values: {
    //   value: false,
    //   title: 'Allow multiple default values for Work Location'
    // },
    // show_associated_locations_only: {
    //   value: false,
    //   title: 'Show associated Locations only'
    // }
  };

  public rateModels: [
    { value: true, label: 'Bill Rate' },
    { value: false, label: 'Pay Rate' },
    { value: false, label: 'Markup' },
  ];

  dateFormats = GlobalConstants?.defaultDateFormat;

  constructor(private alert: AlertService) {}

  ngOnInit(): void {
    this.toggles = {
      hide_images: {
        value: this.configData?.is_candidate_image_hidden,
        title: 'Hide Candidate Profile Images'
      },
      vendor_neutral_program: {
        value: this.configData?.is_vendor_neutral,
        title: 'Vendor Neutral Program'
      },
      is_work_location_read_only: {
        value: this.configData?.is_work_location_read_only,
        title: 'Work Location Read only'
      },
      // allow_multiple_default_values: {
      //   value: this.configData?.allow_multiple_default_values,
      //   title: 'Allow multiple default values for Work Location'
      // },
      // show_associated_locations_only: {
      //   value: this.configData?.show_associated_locations_only ,
      //   title: 'Show associated Locations only'
      // }
    };
    this.dateFormat = this.configData?.preferred_date_format ? this.configData.preferred_date_format.toUpperCase() : null;
    this.rateModel = this.configData?.program_model ? this.configData.program_model.toUpperCase() : null;
    this.rateBudget = this.configData?.job?.job_budget_calculation ?? null; 
  }

  onClickToggle(toggle) {

    if(this.readOnly === false) {
      this.alert.info('Given option can only be changed in EDIT mode');
      return;
    }

    this.toggles[toggle].value = !this.toggles[toggle].value;
    this.configDataChanged()
  }

  onChangeDateFormat() {
    this.configDataChanged()
  }

  onSelectRateModel(event) {
    this.rateModel = event;
    this.configDataChanged()
  }

  configDataChanged(){
    let configChangedData = {
      is_vendor_neutral: this.toggles.vendor_neutral_program.value,
      is_candidate_image_hidden: this.toggles.hide_images.value,
      is_work_location_read_only: this.toggles.is_work_location_read_only.value,
      preferred_date_format: this.dateFormat ? this.dateFormat.toLowerCase() : null,
      program_model: this.rateModel,
      job: {
        job_budget_calculation: this.rateBudget
      }
      // allow_multiple_default_values: this.toggles.allow_multiple_default_values.value,
      // show_associated_locations_only: this.toggles.show_associated_locations_only.value
    }
    this.configDataChange.emit(configChangedData);

  }

  changeJobBudget() {
    this.configDataChanged();
  }
}
