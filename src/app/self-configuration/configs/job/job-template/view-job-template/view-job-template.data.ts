let jobTemplateView: Array<any> = [
    {
      name: '',
      submenuItem: [
        {
            label:  '#ID',
            value: 'job_id' 
        },
        {
            label:  'Status',
            value: 'is_enabled'   
        },
        {
            label:  'Job Category - Title / O*NET Cod',
            value: 'category'   
        },
        {
            label:  'Job Template Code',
            value: 'template_code'   
        },
        {
            label:  'Labor Category',
            value: 'program_industry'   
        },
        {
            label:  'Job Level',
            value: 'level'   
        },
        {
            label:  'Description',
            value: 'description'   
        },
        {
          label:  'Uploaded Description File',
          value: 'jd_parsing_file'
        },
        {
            label:  'job_template_allow_user_role',
            value: 'roles_icon'   
        },
        {
            label:  'Selected Roles',
            value: 'user_role'   
        },
      ],
    },
    {
      name: 'Qualifications',
      submenuItem: [
        {
          label:  'When enabled the system will make Qualifications available for selection on this Job template and the Jobs created with this template.',
          value: 'is_qualification_enabled_icon'   
        },
        {
            label:  'Background Checks',
            value: 'background_check_icon'   
        },
        {
            label:  'Selected Background Checks',
            value: 'backgroundcheckValue'   
        },
        
        {
            label:  'Onboarding Checklist',
            value: 'onboardingChecklist'   
        },
       
      ],
    },
    {
      name: 'Default Fields',
      submenuItem: []
    },
    {
      name: 'Other Settings',
      submenuItem: [
        {
          label: 'Limit Submission “Available Start Date” per Job “Start Date”',
          value: 'is_limit_submission_available'
         },
       {
        label: 'Resume Mandatory',
        value: 'resume_mandatory'
       },
       {
        label: 'Allow Submissions Above Max Bill Rate',
        value: 'maxBillRate'
       },
       {
        label: 'Expense Allowed',
        value: 'is_expense_allowed'
       },
       {
        label: "Allow Users to Edit ‘Expense Allowed’",
        value: 'is_expense_allowed_editable'
       },
       {
        label: 'Allow Express Offer',
        value: 'is_allow_express_offer'
       }
      ],
    },
    {
      name: 'Rate Factors',
      submenuItem: [
       {
        label: 'Selected Rate Factors',
        value: 'rates'
       }
      ],
    },
    {
      name: 'Distribute to Vendors',
      submenuItem: [
        {
         label: 'Submission limit for all vendors',
         value: 'submission_limit_vendor'
        },
        {
          label: 'Distribution Type',
          value: 'distributionType',
          useI18: true
        },
        {
            label: 'Distribution Method',
            value: 'distributionMethod',
            useI18: true
          }
        
      ],
    },
    {
      name: 'Associations',
      submenuItem: [
        {
          label: 'Hierarchy',
          value: 'hierarchy'
        },
        {
          label: 'Job Type',
          value: 'job_type'
        },
      ]
    }
  ];
  
  export default jobTemplateView;
  