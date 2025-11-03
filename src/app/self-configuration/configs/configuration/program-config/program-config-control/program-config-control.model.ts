export interface IProgramConfigurationControl {
  description?: string;
  subtitle: string;
  title?: string;
  type?: ControlType;
  dropDrownData?: Array<any>;
  radioItems?: Array<any>;
  formControlName?: string;
  directoryIcon?: boolean,
  subDirectoryIcon?: boolean,
  placeholderText?: string
  isSelected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  sortNotRequired?: boolean;
  nonEditable?: Array<string>;
  selectedValue?: string;
  isRequired?: boolean;
  sequence?:number;
  mandatePattern?: RegExp | string;
  timerMin?: number;
  errorText?: string;
  hidden?: boolean;
}

export enum ControlType {
  TOGGLE = 0,
  DROPDOWN = 1,
  MULTISELECTDROPDOWN = 2,
  TEXTBOX = 3,
  TEXTAREA = 4,
  NUMERIC = 5,
  RADIO = 6,
  NUMBERSELECTOPTION = 7,
  TABULARINPUT = 8,
  TIMER = 9
}

export enum EnableNotificationType {
  ENABLE_NOTIFICATION_ENGINE = 'Enable Notification Engine',
  MODULES = 'Modules',
}