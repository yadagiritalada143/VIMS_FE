import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Address, Candidate } from './duplicate-candidates.model';
import { LOG_TYPE, Log, hideType } from '../alert/alert.model';
import i18next from 'i18next';
import { UsersType } from '../../enums';
import { StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-duplicate-candidates',
  templateUrl: './duplicate-candidates.component.html',
  styleUrls: ['./duplicate-candidates.component.scss'],
})
export class DuplicateCandidatesComponent implements OnChanges, OnInit {
  @Input() duplicateCandidates: Candidate[];
  @Input() showDuplicateCandidateLoader = false;
  @Input() currentProgram: any = undefined;
  @Input() hideType: hideType = hideType.Collapse;
  @Output() viewProfileAction = new EventEmitter<Candidate>();
  @Output() useThisProfileAction = new EventEmitter<Candidate>();
  duplicateCandidatesLogs: Log = undefined;
  isClient: boolean = false;
  isCollapsed = false

  constructor(
    private storageService: StorageService
  ) {}

  onViewProfileButtonClick(candidate: Candidate) {
    this.viewProfileAction.emit(candidate);
  }

  onUserThisProfileButtonClick(candidate: Candidate) {
    this.useThisProfileAction.emit(candidate);
  }

  ngOnInit(): void {
    const user_type = this.storageService.get('user_type');
    this.isClient = user_type?.toUpperCase() === UsersType.CLIENT;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.duplicateCandidates && changes.duplicateCandidates.currentValue)
      this.formatCandidateLog(changes.duplicateCandidates.currentValue.length);
  }

  formatAddress(addresses: Address[]) {
    if (addresses.length === 0) return '';
    const address = addresses.find((addr)=>(addr.type==="PRIMARY"))
    const address_parts = [
      address.street_1,
      address.street_2,
      address.city,
      address.county,
      address.state,
      address.country,
      address.zipcode,
    ];
    const filtered_parts = address_parts.filter(part => part !== null);
    return filtered_parts.join(', ');
  }

  formatName(firstname: string | null, middlename, lastname) {
    const name_parts = [firstname, middlename, lastname];
    const filtered_parts = name_parts.filter(part => part !== null && part != '');
    return filtered_parts.join(' ');
  }

  formatCandidateLog(resultCnt: number) {
    const message = i18next.t('mtp_warn_result_log_message', { count: resultCnt });
    const header = i18next.t(resultCnt == 0 ? 'mtp_info_result_log_heading' : 'mtp_warn_result_log_heading');
    this.duplicateCandidatesLogs = {
      type: resultCnt == 0 ? LOG_TYPE.INFO : LOG_TYPE.WARNING,
      heading: header,
      messages: [message],
      autoClose: false,
      isShown: true,
      hideType: resultCnt == 0 ? hideType.Close : this.hideType,
      isCollapsed: this.hideType===hideType.Collapse ? this.isCollapsed : undefined
    };
  }
  
  handleClose() {
    this.duplicateCandidates = []
  }

  handleExpand() {
    this.isCollapsed = false
  }

  handleCollapse() {
    this.isCollapsed = true
  }

  get profileImageHide() {
    return (this.isClient && this.currentProgram?.config?.is_candidate_image_hidden);
  }
}
