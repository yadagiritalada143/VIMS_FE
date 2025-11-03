export interface VMSConfig {
  columnList: ColumnConfig[];
  tabsList?: string[];
  isSearch?: boolean;
  isSetting?: boolean;
  isFilter?: boolean;
  isTopPagination?: boolean;
  isReorder?: boolean;
  isCreate?: boolean;
  isCreateButtonName?: string;
  title?: string;
  isExpand?: boolean;
  hideHeaderExpand?: boolean;
  isBack?: boolean;
  submenuName?: string;
  density?: string;
  isDownload?: boolean;
  hideBottomPagination?: boolean;
  isTheme?: true;
  hideHeaderTop?: boolean;
  options?: any[];
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
  showRecordSelect?: boolean;
  filterCandidateBy?: any[];
}

export interface ColumnConfig {

  message?: string;
  status?: string;

  isRateCard?: boolean;
  isCustomField?: boolean;
  titleName?: string;
  index?: number;
  name: string;
  title?: string;
  width?: number;
  isIcon: boolean;
  isIconSrc?: boolean;
  icon?: string;
  iconClass?: string;
  isImage: boolean;
  isNumberBadge: boolean;
  isContact: boolean;
  isNoOption?: boolean;
  isVieworEdit?: boolean;
  isCreateJob?:boolean;
  isVieworClone?: boolean;
  isDisableorDelete?: boolean;
  isDelete?: boolean;
  isDeleteInVisible?: boolean;
  isStatusColor?: boolean;
  isIconList?: boolean;
  isMultiUser?: boolean;
  enableClick?: boolean;
  isShowCheckBox?: boolean;
  isCheckBoxReadonly?:boolean;
  isProfileMatch?: boolean;
  isCandidateStatus?: boolean;
  isWithdrawal?: boolean;
  isViewProfile?: boolean;
  isRange?: boolean;
  rangeNameList?: string[];
  isDetails?: boolean;
  isInterview?: boolean;
  isViewEnabled?: boolean;
  isOptOut?: Boolean;
  isSubmitCandidate?: Boolean;
  options?: any[];
  isDescription?: boolean;
  isNotificationType?: boolean
}

export interface AdvanceFiltter {
  name: string;
  title: string;
  filterType: FilterType;
  placeholder?: string;
  multiSelectData?: MultiSelectData[];
  searchEvent?: string;
  fieldLoading?: boolean;
}

export interface MultiSelectData {
  name: string;
  value: any;
}

export type FilterType = 'TEXT' | 'MULTISELECT' | 'SELECT' | 'DATERANGE' | 'MULTICHIP' | 'CHECKBOX' | 'MULTICHECKBOX' | 'NUMBER';
