export const schedulePanelForm = [
  {
    label: 'Schedule Name',
    controlName: 'schedule_name',
    required: true,
    placeholder: 'Enter your Schedule Name',
    type: 'input',
    width: '486px',
    isWarmingVisible: false,
  },
  {
    label: 'Schedule Status',
    controlName: 'schedule_status',
    required: true,
    placeholderTrue: 'Active',
    placeholderFalse: 'Inactive',
    type: 'switcher',
    width: '172px',
  },
  {
    label: 'Subject',
    controlName: 'subject',
    required: true,
    placeholder: 'Enter Email subject',
    type: 'input',
    width: '100%',
    isWarmingVisible: false,
  },
  {
    label: 'Report Scheduler',
    controlName: 'run_schedular_as',
    required: true,
    placeholder: 'Run report as',
    type: 'select',
    options: ['OWN'],
    multiple: false,
    width: '100%',
    bindLabel: 'text',
  },
  // {
  //     title: 'Recipient(s)',
  //     label: 'User roles as recipients',
  //     controlName: 'reciver',
  //     required: false,
  //     placeholder: 'Selection of User roles as recipients',
  //     type: 'select',
  //     options: [],
  //     multiple: true,
  //     width: '100%',
  //     bindLabel: 'text'
  // },
  {
    title: 'Recipient(s)',
    label: 'Users as recipients',
    controlName: 'recipient',
    required: false,
    placeholder: 'Selection of Users as recipients',
    type: 'select',
    options: [],
    multiple: true,
    width: '100%',
    bindLabel: 'name',
    loading: false,
    search: true,
  },
];

export const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const weeksOfMonth = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

export const startPageParams = {
  limit: 10,
  page: 1,
};
