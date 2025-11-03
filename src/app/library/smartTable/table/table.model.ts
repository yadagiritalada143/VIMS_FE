import { Subject } from 'rxjs';

export interface VMSConfig {
  formatColumns?:FormatColumnConfig;
  columnList: ColumnConfig[];
  tabsList?: string[];
  isSearch?: boolean;
  isSetting?: boolean;
  isMonthYearFilter?: boolean;
  isFilter?: boolean;
  isTopPagination?: boolean;
  isCreate?: boolean;
  isCreateButtonName?: string;
  title: string;
  isExpand?: boolean;
  checkboxTooltip?: string;
  submenuName?: string;
  density?: string;
  isDownload?: boolean;
  isViewBaseReport?: boolean;
  hideBottomPagination?: boolean;
  selectAllRecordsFromBar?: boolean;
  isTheme?: true;
  tableWidth?: string;
  isShortBy?: string;
  permission?: string;
  searchPlaceHolder?: string;
  /**
   * @author Prateek Singhal
   * Modified variable name as naming convention was wrong.
   */
  hideHeader?: boolean;
  hideResultCount?: boolean;
  showTabs?: boolean;
  subTitle?: string;
  isIdDifferent?: boolean;
  differentId?: string;
  advanceFilter?: AdvanceFiltter[];
  isSort?: boolean;
  isSelectSubmitButton?: boolean;
  isCheckboxOption?: boolean;
  isSelectSubmitButtonName?: string;
  isDownloadButton?: boolean;
  downloadOptions?: {},
  isPendingReportButton?: boolean;
  routeLinkOption?: string;
  routeLinkText?: string;
  tableNoDataObj?: object;
  isDistributionList?: boolean;
  isJobList?: boolean;
  isTopHeader?: boolean;
  fullPageTable?: boolean;
  isCurrency?: boolean;
  sortOptions?: any[];
  allowMultiselect?: boolean;
  headerActionButtons?: HeaderActionButton[];
  subHeaderActionButtons?: HeaderActionButton[];
  filterCandidateBy?: any[],
  recordsPerPageSetting?: any [],
  allowReordering?: boolean,
  enableGenricListViewButton?:boolean
  genericListConfig?:{URL:string,oldURL:string},
  showScoreCalculator?: boolean;
  showComparisonBtn?: boolean;
  compareDisabled?: boolean;
  scoreFactors?: any[];
  isActionDropdown?: boolean;
}

export interface FormatColumnConfig{
  numericTypeColumns: string[],
  amountTypeColumns: string[]
}

export interface ColumnConfig {
  index?: number;
  name: string;
  title?: string;
  width?: number;
  isIcon: boolean;
  icon?: string;
  iconClass?: string;
  isImage: boolean;
  isNumberBadge: boolean;
  isContact: boolean;
  isNoOption?: boolean;
  isVieworEdit?: boolean;
  isVieworEditFlow?: boolean;
  isDeleteFlow?: boolean;
  isEditEditRule?: boolean;
  isVieworEditCandidate?: boolean;
  isEditorReview?: boolean;
  isVieworClone?: boolean;
  isDisableorDelete?: boolean;
  isDelete?: boolean;
  isStatusColor?: boolean;
  isIconList?: boolean;
  isMultiUser?: boolean;
  enableClick?: boolean;
  isShowCheckBox?: boolean;
  isCheckBoxReadonly?: boolean;
  isProfileMatch?: boolean;
  isCandidateStatus?: boolean;
  isWithdrawal?: boolean;
  isOfferCandidateWithdrawal?: boolean;
  isViewProfile?: boolean;
  isRange?: boolean;
  rangeNameList?: string[];
  isDetails?: boolean;
  isInterview?: boolean;
  isViewEnabled?: boolean;
  isOptOut?: boolean;
  isOptIn?: boolean;
  isSubmitCandidate?: boolean;
  options?: any[];
  isOpenView?: boolean;
  toolTipVisibility?: boolean;
  permission?: string;
  isArray?: boolean;
  isNavigation?: boolean;
  isSort?: boolean;
  isFIle?: boolean;
  isDescription?: boolean;
  showComplianceOption?: boolean;
  isScheduleInterview?: boolean;
  isRescheduleInterview?: boolean;
  isEditInterview?: boolean;
  isCancelInterview?: boolean;
  isInterviewReview?: boolean;
  isEditInterviewReview?: boolean;
  isCancelInterviewReview?: boolean;
  isPending?: boolean;
  isDoNotRehire?: boolean;
  linearProgressBar?: boolean;
  circularProgressBar?: boolean;
  canViewMtp?: Boolean

  isshowRehire?: boolean;
  isObjectStatusShow?: boolean;
  isRejectCandidate?: boolean;
  isCreateOffer?: boolean;
  isRateInterview?: boolean;
  isAddAndSubmit?: boolean;
  hideBadege?: boolean;
  showTitleCase?: boolean;
  isCounterOffer?: boolean;
  isRejectOffer?: boolean;
  isRejectedJob?: boolean;
  isDraftJob?: boolean;
  isCloneJob?: boolean;
  isAcceptOffer?: boolean;
  isCurrency?: boolean;
  isOnboardingCandidate?: boolean;

  isDistribute?: boolean;
  isApprove?: boolean;
  isReject?: boolean;
  isHold?: boolean;
  isReDistribute?: boolean;
  isHaltSubmission?: boolean;
  isRelease?: boolean;
  isClose?: boolean;
  isReview?: boolean;
  isEditAndReview?: boolean;
  showPreviewIcon?: boolean;
  isAction?: boolean;
  isEditOffer?: boolean;
  isClickable?: boolean;
  isOption?: boolean;
  isRedirect?: boolean;
  isDate?: boolean;
  isDownloadBtn?: boolean;
  isOfferReview?: boolean;
  isEditJob?: boolean;
  isTooltip?:object;
  isOptInOptOut?: boolean;
  isMasked?: boolean;
  isManagerList?: boolean;
}

export interface HeaderActionButton {
  title: string;
  class?: string;
  disabled?: boolean;
}

export interface AdvanceFiltter {
  name: string;
  title: string;
  filterType: FilterType;
  placeholder?: string;
  placeholder_1?: string;
  multiSelectData?: MultiSelectData[];
  eventEmiiter?: Subject<any>;
  changeHandler?: any;
  loading?: boolean;
  eventListener?: string;
  mandatory?: boolean;
  hasDependency?: boolean;
  changeOutput?: any;
  dependentFieldName?: string;
}

export interface MultiSelectData {
  name: string;
  value: any;
}

export interface ActionList {
  name: string;
}

export type FilterType =
  | 'TEXT'
  | 'NUMBER'
  | 'GOOGLEADDRESS'
  | 'MULTISELECT'
  | 'SELECT'
  | 'DATERANGE'
  | 'RANGE';
