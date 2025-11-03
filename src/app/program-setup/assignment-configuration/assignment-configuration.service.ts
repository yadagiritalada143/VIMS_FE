import { Injectable } from '@angular/core';
import { HttpService } from '../../../app/core/services/http.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AssignmentConfigurationService {
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

  getAssignmentDropdownOptions() {
    return {
      massUpdateOptions: [{ "key": "assignment_manager", "label": "Assignment Manager", "option": [], "is_enabled": true , "type" : 'native' },
      { "key": "timesheet_manager", "label": "Timesheet Manager", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "expense_manager", "label": "Expense Manager", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "work_location", "label": "Work Location", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "client_bill_rate", "label": "Client Bill rate", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "end_date", "label": "Assignment End date", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "msp_fees", "label": "MSP Fees", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "Pay_rate", "label": "Pay rate", "option": [], "is_enabled": true , "type" : 'native'},
      { "key": "taxes", "label": "Taxes", "option": [], "is_enabled": true , "type" : 'native'},
      ],
      fieldMassUpdateOptions: [
        { "key": "native", "label": "Native Field" , id: 1 },
        { "key": "MDT", "label": "Master Data Type" , id:2},
        // { "key": "custom", "label": "Custom" , id:3}  // temporarily remove this option for ticket 30771
      ],
      budgetOptions: [
        { value: 'assignment_start_date', name: 'Assignment Start Date' },
        { value: 'offer_start_date', name: 'Offer Start Date' },
        { value: "original_start_date", name: "Original Start Date" },
        { value: "timesheet_start_date", name: "Timesheet Start date" }],
      secondaryAssignmentOptions: [{ value: 'all', name: 'All Assignment' }, { value: 'open', name: 'All Open Assignment' }, { value: 'close', name: 'All Closed Assignment' }],
      temporaryAccessTypeOptions: [{ value: 'hour', name: 'Hour' }, { value: 'day', name: 'Day' }, { value: 'week', name: 'Week' }, { value: 'month', name: 'Month' }],
      updateStartDate: [{ value: 'day', name: 'Day' }, { value: 'week', name: 'Week' }, { value: 'month', name: 'Month' }],
      additionalBudgetAddTypeOptions: [{ value: 'days', name: 'Days' }],
      budgetConsumptionOperators: [{ value: '>', name: '>' }, { value: '>=', name: '>=' }, { value: '<', name: '<' }],
      consumptionThresholdOptions: [
        { value: 'fixed', name: 'Fixed' },
        { value: 'percentage', name: 'Percentage' }
      ],
      activeOnData: [
        // { label: 'Create & Save with Approval(s)', value: 'approval' , isEnabled: false}, //commented  for V2M-21886 as not yet implemented from backend.
        { label: 'Create & Save(Bypass Approval(s))', value: 'create' , isEnabled: false},
        // { label: 'Background & onboarding completion + Approval', value: 'onboard_bgcheck_approval',isEnabled: false},
        { label: 'Onboarding & Approval(s)', value: 'onboard_approval' , isEnabled: false},
        // { label: 'Background & Onboarding completion', value: 'onboard_bgcheck' , isEnabled: false},
        // { label: 'Background Completion', value: 'bgcheck' , isEnabled: false},
        { label: 'Onboarding Completion', value: 'onboard' , isEnabled: false}
      ],
      updateImpactApprovedTS: [{ value: false, name: 'Approver Approves Impacted Timesheet' }, { value: true, name: 'System Auto-Approves Impacted Timesheet(s)' }]
    }
  }

  getDefaultAssignmentConfig() {
    return {
      entity_code: "assignment_setting",
      config: {
        budget: {
          value: null,
          is_allow: false
        },
        re_open: {
          is_allow: false
        },
        evaluate: {
          is_allow: false
        },
        onboarding: {
          is_allow: true
        },
        mass_update: {
          options: [],
          selectedValues : [],
          is_allow: true,
        },
        temp_access_data: {
          timesheet: {
            submit: {
              is_allow: false,
              type: null,
              user_type: "vendor",
              period: null
            },
            modify: {
              is_allow: false,
              type: null,
              user_type: "vendor",
              period: null
            },
            past_period: {
              is_allow: false,
              type: null,
              user_type: null,
              period: null
            },
            past_period_allow: false
          },
          expense: {
            submit: {
              is_allow: false,
              type: null,
              user_type: "vendor",
              period: null
            },
            modify: {
              is_allow: false,
              user_type: "vendor",
              type: null,
              period: null
            }
          },
          is_allow: false,
        },
        active_on:{options: [{key: "all", value: null}]},
        update_start_date: {
          type: null,
          period: null,
          is_allow: false,
        },
        show_managers : {
          create : {
            key : "create_quick_assignment",
            label : "Show all Create assignment",
            is_enabled : false
          },
          update : {
            key : "update_assignment",
            label : "Show all Update assignment",
            is_enabled : false
          }
        },
        /* temporary_access:[
           {
             is_allow: false,
             module_type:"timesheet",
             module_action:{
                 "modify":{
                    "option":[
                       {
                          "type": "day",
                          "period": 10,
                          "is_allow":false,
                          "user_type":"vendor"
                       }
                    ],
                    "is_allow":true
                 },
                  "submit":{
                    "option":[
                       {
                         "type": "month",
                         "period": 4,
                          "is_allow":false,
                          "user_type":"vendor"
                       }
                    ],
                    "is_allow":false
                 }
              }
           },
            {
             is_allow: false,
             module_type:"expense",
             module_action:{
                 "modify":{
                    "option":[
                       {
                          "type": null,
                          "period": null,
                          "is_allow":false,
                          "user_type":"vendor"
                       }
                    ],
                    "is_allow":true
                 },
                 "submit":{
                    "option":[
                       {
                          "type": null,
                          "period": null,
                          "is_allow":false,
                          "user_type":"vendor"
                       }
                    ],
                    "is_allow":false
                 }
              }
           }
        ], */
        additional_budget: {
          options: [{ key: "allow_add", options: { type: null, period: null }, is_enabled: false },
          { key: "auto_close_on_budget", is_enabled: false },
          { key: "restrict_ts", options: {}, is_enabled: false },
          { key: "threshold", options: { type: null, operator: null, value: null }, is_enabled: false }
          ],
          is_allow: false
        },
        assignment_title: {
          is_allow: true,
          search_by_job: true,
          search_by_job_template: false,
          allow_filled_job_selection : false
        },
        update_assignment_title: {
          is_allow: true,
          search_by_job: true,
          search_by_job_template: true
        },
        update_impact_approved_ts: {
          options: [{ key: "auto_approve", is_enabled: false }],
          is_allow: true
        },
        secondary_assignment: {
          value: null,
          is_allow: false
        },
        do_not_rehire: {
          is_allow: false,
          options: [
            { key: "allow_create_assignment", is_enabled: false }]
        },
        project_based: {
          is_allow: false,
          is_create: false,
          create:{
            activity_rename: false
          },
          timesheet_type:[]
        },
        quick_extension: {
          options : {
            with_rate : false
          },
          is_allow : false
        },
        quick_rate_change: {
          is_allow: false
        },
        rate_factors_editable : {
          is_allow: false
        },
        overlapping_assignments : {
          is_allow : true
        }
      },
      work_locations: [], roles: [], hierarchies: [],
    };
  }
}

