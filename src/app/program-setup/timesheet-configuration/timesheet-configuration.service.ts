import { Injectable } from '@angular/core';
import { HttpService } from '../../../app/core/services/http.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TimesheetConfigurationService {
  mockApi: string;
  constructor(
    public storageService: StorageService,
    public _http: HttpService
  ) { }


  get(url) {
    return this._http.get(url);
  }
  post(url, payload) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }
  delete(url, payload) {
    return this._http.delete(url, payload);
  }
  getHierarchy() {

  }

  getTimesheetDropdownOptions() {
    return {
      weekPeriods: [{value: "weekly", name: "Weekly"},
      // {value: "Monthly", name: "Monthly"}
    ],
      days: [
        { value: 'sunday', name: 'Sunday' },
        { value: 'monday', name: 'Monday' },
        { value: 'tuesday', name: 'Tuesday' },
        { value: 'wednesday', name: 'Wednesday' },
        { value: 'thursday', name: 'Thursday' },
        { value: 'friday', name: 'Friday' },
        { value: 'saturday', name: 'Saturday' }],
       projectCodeIntegration: [
        {
          id: 'project', value: "project-code-integration", name: "Project Integration",
          slug: "project-code-integration", parent_type: "project-code-integration", type: "project-code-integration"
        }],
      workerCode: [
        {
          id: 'workercode1', value: "account_code", name: "Account Code",
          slug: "account_code",
          parent_type: "worker_code",
          type: "worker_code"
        },
        {
          id: 'project1', value: "project", name: "Activity Based Pricing",
          slug: "project",
          parent_type: "worker_code",
          type: "worker_code"
        }],
      timesheetProjectTypes:[{ value: "foundational_data", name: "Master Data Type" },{ value: "custom_data", name: "Custom Field" },{ value: "project-x", name: "Rate Type" },{ value: "project-code-integration", name: "Project Integration" },{ value: "worker_code", name: "Worker Code" }],
      projectXPredefinedValues:[{parent_type: 'project-x', name: 'ST', value: 'ST'},{parent_type: 'project-x', name: 'OT', value: 'OT'},{parent_type: 'project-x', name: 'DT', value: 'DT'},{parent_type: 'project-x', name: 'Holiday ST', value: 'Holiday ST'},
        {parent_type: 'project-x', name: 'Holiday OT', value: 'Holiday OT'}, {parent_type: 'project-x', name: 'Holiday DT', value: 'Holiday DT'}, {parent_type: 'project-x', name: 'Weekend ST', value: 'Weekend ST'}, {parent_type: 'project-x', name: 'Weekend OT', value: 'Weekend OT'},{parent_type: 'project-x', name: 'Weekend DT', value: 'Weekend DT'}],
      timeSheetTypes:[{ value: 'hours', name: 'Hours' , label: 'Hourly'},{ value: 'cico', name: 'TITO', label: 'TITO'},{ value: 'days', name: 'Days' , label: 'Daily'}],
      breakTypes:[{ value: 'break', name: 'Break' }, { value: 'rest', name: 'Rest Break' },{ value: 'meal', name: 'Meal Break' }, { value: 'lunch', name: 'Lunch Break' }],
      hierarchies: null,
      dayNumbers: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'],
      timeFormats: [{ value: "12", name: "12 Hours" }, { value: "24", name: "24 Hours" }],
      uploadLevels: [{ value: 'day_level', name: 'Day' }, { value: 'week_level', name: 'Week' }, { value: 'project_level', name: 'Project' }, { value: 'timesheet_level', name: 'Timesheet' }],
      accessOptions: [{ value: 'day', name: 'Day' }, { value: 'week', name: 'Week' }, { value: 'month', name: 'Month' }],
      copyOptions: [{ value: 'week', name: 'Weekly' }],
      softDeleteOptions: [{ value: 'pending', name: 'Pending Timesheet' }, { value: 'approved', name: 'Approved Timesheet' }],
      hoursInputTypes:[{ value: 'decimal', name: 'Decimal' }, { value: 'hour', name: 'Hours' }],
      hoursInputTypeFormat:[{ value: 'hh:mm', name: 'HH:mm' }, { value: 'hh:mm:ss', name: 'HH:mm:ss' }],
      decimalInputTypeFormat:[{ value: 'actual_decimal', name: 'Decimal' }, { value: 'lowest_decimal', name: 'Lowest Decimal>> 0.25, 0.50, 0.75' }],
      hoursAllocationTypes:[{ value: 'automation', name: 'Automated Allocation' },{ value: 'manual', name: 'Manual Allocation (ST,OT,DT)' },{ value:'hybrid', name:'Hybrid'}],
      modificationOptions:[{ value: 'timesheet_approval_date', name: 'Timesheet Approved Date' }, { value: 'invoice_run_date', name: 'Invoice run date' }, { value: 'assignment_end_date', name: 'Assignment end date' }],
      penaltyLimitOptions:[{ value: 0, name: 'All' },{ value: 1, name: 'One' },{ value: 2, name: 'Two' },{ value: 3, name: 'Three' },{ value: 4, name: 'Four' }],
      penaltyRateOptions:[{ value: 0, name: 'All' },{ value: 'ST', name: 'ST' },{ value: 'OT', name: 'OT' },{ value: 'DT', name: 'DT' }],
    }
  }

  getDefaultTimeSheetConfig() {
   return {
    "hierarchy_id": null,    
    "hierarchy": {
      id:null,
      name:null
    },
    "title": null,
    "start_date" : null,
    "is_active": true,
    "status": true,
    "location_type":[],
    "remote_country":[],
    "remote_state":[],
    "remote_county":[],
    "remote_city":[],
    "rules": {
        "basic_rules": {
            "disable_override_rule": false,
            "disable_hours_validate": false,
            "is_enable_day_visibility": false,
            "timesheet_taxable": false,
            "timesheet_type": [],
            "max_regular_daily_hours": 0,
            "max_regular_weekly_hours": 0,
            "timesheet_start_date": null,
            "working_days_in_week": 0,
            "time_format": null,
            "hour_type_calculation": null,
            // "is_allow_mass_approval": true,
            "overnight": true,
            "is_enable_daily_hour_limit": false,
            "allowed_maximum_daily_hours": 0,
            "is_enable_weekly_hour_limit": false,
            "allowed_maximum_weekly_hours": 0,
            "disable_validate_rule": false,
            "work_week": {
              "period": null,
              "week_start_day": null,
              "week_number": 0,
              "month_start_day": null
            },
            "copy_timesheet": {
              "is_allow": true,
              "option": {
                "period": null,
                "type": Number
              }
            },
            "hours_input_type": {
              "type": null,
              "format": null
            },
            "project": {
              "is_allow": false,
              "option": [ ]
            },
            "header":{
              "foundational_data":{
                  "is_allow":false,
                  "value":[]
              }              
            },
            "break": {
              "is_allow": true,
              "options": [
                {
                  "type": null,
                  "is_mandatory": false,
                  "is_paid_inclusive": false,
                  "is_validate_break_limit": false,
                  "break_rule": [
                    {
                      "break_number": "0",
                      "min_hours": 0,
                      "operator": "AND",
                      "max_hours": 0,
                      "max_duration": 0
                    }
                  ],
                  "penality_rule": {
                    "is_allow": false,
                    "limit": null,
                    "rate": null,
                    "value": null,
                    "unit": "hour"
                  }
                }
              ]
            },
            "print": {
              "is_allow": false,
              "option": {
                "worker": false,
                "msp": false,
                "vendor": false
              }
            },
            "weekend": {
              "is_allow_entry": false,
              "is_paid": false,
              "option": []
            },
            "half_day_fixed_hours_rule": {
              "is_allow": false,
              "option": [
                {
                  "day": 0,
                  "hour": 0
                },
                {
                  "day": 0,
                  "hour": 0
                }
              ]
            },
            /* "delete_option": {
                "is_allow": false,
                "option": {
                    "day_level": false,
                    "timesheet_level": false
                }
            }, */
            "soft_delete": {
                "is_allow": true,
                "option": []
            },
            "grace_period": {
              "is_allow": false,
              "option": {
                // "worker": {
                //   "is_allow": false,
                //   "period": 0,
                //   "type": null
                // },
                // "vendor": {
                //   "is_allow": false,
                //   "period": 0,
                //   "type": null
                // },
                // "msp": {
                //   "is_allow": false,
                //   "period": 0,
                //   "type": null
                // }
              }
            },
            "past_period": {
              "is_allow": false,
              "option": {
                "worker": {
                  "is_allow": false,
                  "period": 0,
                  "type": null
                },
                "vendor": {
                  "is_allow": false,
                  "period": 0,
                  "type": null
                },
                "msp": {
                  "is_allow": false,
                  "period": 0,
                  "type": null
                }
              }
            },
            "future_period": {
              "is_allow": false,
              "option": {
                "worker": {
                  "is_allow": false,
                  "period": 0,
                  "type": null
                },
                "vendor": {
                  "is_allow": false,
                  "period": 0,
                  "type": null
                },
                "msp": {
                  "is_allow": false,
                  "period": 0,
                  "type": null
                }
              }
            },
             "hours_modification_period": {
                "is_allow": true,
                "option": {
                    "client": {
                        "is_allow": true,
                        "period": 0,
                        "type": "day",
                        "applicable_on": null
                    },
                    "vendor": {
                         "is_allow": true,
                        "period": 0,
                        "type": "day",
                        "applicable_on": null
                    },
                    "msp": {
                         "is_allow": true,
                        "period": 0,
                        "type": "day",
                        "applicable_on": null
                    }
                }
            },
            "notes": {
              "is_allow": true,
              "option": {
                "day_level": {
                  "is_allow": false,
                  "is_mandatory": false
                },
                "week_level": {
                  "is_allow": false,
                  "is_mandatory": false
                },
                "project_level": {
                  "is_allow": false,
                  "is_mandatory": false
                },
                "timesheet_level": {
                  "is_allow": false,
                  "is_mandatory": false
                }
              }
            },
            "upload": {
              "is_allow": false,
              "is_mandatory": false,
              "option": {
                "day_level": {
                  "is_allow": false,
                  "is_mandatory": false
                },
                "week_level": {
                  "is_allow": false,
                  "is_mandatory": false
                },
                "project_level": {
                  "is_allow": false,
                  "is_mandatory": false
                },
                "timesheet_level": {
                  "is_allow": false,
                  "is_mandatory": false
                }
              }
            },
            "is_enable_amount_visibility": true
        }
    }
    };
  }
}

