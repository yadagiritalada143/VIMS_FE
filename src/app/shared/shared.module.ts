import { AccountCodeGenerateComponent } from './../library/account-code-generate/account-code-generate.component';
import { PopoverComponent } from './components/popover/popover.component';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FilterPipe } from './components/filter/filter';
import { HeaderComponent } from './components/header/header.component';
import { LangSwitcherComponent } from './components/lang-switcher/lang-switcher.component';
import { ModulesComponent } from './components/modules/modules.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ProgramManageComponent } from './components/program-manage/program-manage.component';
import { ProgramsComponent } from './components/programs/programs.component';
import { SearchAddressComponent } from './components/search-address/search-address.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SvmsDatepickerComponent } from './components/svms-datepicker/svms-datepicker.component';
import { SvmsSidebarBodyComponent } from './components/svms-sidebar/svms-sidebar-body/svms-sidebar-body.component';
import { SvmsSidebarExtendedComponent } from './components/svms-sidebar/svms-sidebar-extended/svms-sidebar-extended.component';
import { SvmsSidebarFooterComponent } from './components/svms-sidebar/svms-sidebar-footer/svms-sidebar-footer.component';
import { SvmsSidebarComponent } from './components/svms-sidebar/svms-sidebar.component';
import { AddressContactDetailsComponent } from './components/svms-tab-components/address-contact-details/address-contact-details.component';
import { BasicInfoComponent } from './components/svms-tab-components/basic-info/basic-info.component';
import { HierarchyComponent } from './components/svms-tab-components/hierarchy/hierarchy.component';
import { PermissionsComponent } from './components/svms-tab-components/permissions/permissions.component';
import { SvmsUploadAvatarModule } from './components/svms-upload-avatar/svms-upload-avatar.module';
import { SvmsUploadProfileAvatarModule } from './components/svms-upload-profile-avatar/svms-upload-profile-avatar.module';
import { TabsModule } from './components/tabs/tabs.module';
import { ThemeSwitcherComponent } from './components/theme-switcher/theme-switcher.component';
import { DebounceDirective } from './directives/debounce.directive';
import { I18nDirective } from './directives/i18n.directive';
import { PasswordToggleDirective } from './directives/password-toggle.directive';
import { ResponsiveMenuDirective } from './directives/responsive-menu.directive';
import { ResumeUploadComponent } from './components/svms-tab-components/resume-upload/resume-upload.component';
import { TooltipDirective } from './directives/tooltip.directive';
import { FocusDirective } from './directives/focus.directive';
import { AuthorizeDirective } from './directives/validate-permission.directive';
import { AccessControlDirective } from './directives/access-control.directive';
import { InputDateComponent } from './input-date.component';
import { ShortNamePipe } from './pipe/short-name.pipe';
import { AddressService } from './service/utility/address.service';
import { TranslationService } from './service/utility/translation.service';
import { AwsS3FileUploadService } from './service/utility/aws.s3.upload.service';
import { HighlightDirective } from './directives/highlight.directive';
import { ChunkPipe } from './pipe/chunk.pipe';
import { DragAndDropDirective } from './directives/drag-and-drop.directive';
import { RemovePrefixSuffixPipe } from './pipe/remove-prefix-suffix.pipe';
import { OnlyNumberDirective } from './directives/only-number.directive';
import { ButtonLoaderComponent } from './components/button-loader/button-loader.component';
import { NoDataComponent } from './components/sidebar/no-data/no-data.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { CreateRoleComponent } from '../user-management/create-role/create-role.component';
import { StatusComponent } from './components/status/status.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { CurrencyService } from './service/currency.service';
import { QuestionComponent } from './components/question/question.component';
import { ConfirmationReasonBoxComponent } from './components/confirmation-reason-box/confirmation-reason-box.component';
import { HttpClientModule } from '@angular/common/http';
import { ReasonCodesService } from './service/reson-codes.service';
import { StatusMessageComponent } from './components/status-message/status-message.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { ProgramConfigurationComponent } from './components/program-configuration/program-configuration.component';
import { ExpressionBuilderConditionComponent } from './components/expression-builder-condition/expression-builder-condition.component';
import { RuleBuilderConditionComponent } from './components/rule-builder-condition/rule-builder-condition.component';
import { ExpressionBuilderRecipientComponent } from './components/expression-builder-recipient/expression-builder-recipient.component';
import { CommonViewRuleFlowComponent } from './components/common-view-rule-flow/common-view-rule-flow.component';
import { SnakeToTitleCasePipe } from './pipe/snake-to-title-case.pipe';
import { NgbModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarResponsiveDirective } from './directives/calendar-responsive.directive';
import { PasswordStrengthComponent } from './components/password-strength/password-strength.component';
import { CreatePreIdentifiedCandidateComponent } from './components/create-pre-identified-candidate/create-pre-identified-candidate.component';
import { AllowUptoNDigitDecimalNumberDirective } from './directives/allow-upto-n-decimal-places.directive';
import { SafeHtmlPipe } from './pipe/safe-html.pipe';
import { SupportFlyoutComponent } from './components/sidebar/support-flyout/support-flyout.component';
import { UniqueKeyPipe } from './pipe/unique-key.pipe';
import { SvmsDragTableComponent } from './components/svms-drag-table/svms-drag-table.component';
import { DndModule } from 'ngx-drag-drop';
import { HierarchyTreeviewComponent } from './components/hierarchy-treeview/hierarchy-treeview.component';
import { TreeviewModule } from 'ngx-treeview';
import { SortHelperPipe } from './pipe/sort-helper.pipe';
import { QrScannerComponent } from './components/qr-scanner/qr-scanner.component';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { ConfigCommonListingComponent } from './components/config-common-listing/config-common-listing.component';
import { PrecisionPipe } from './pipe/precision.pipe';
import { AccuracyPipe } from './pipe/accuracy.pipe';
import { InputAccuracyDirective } from './directives/input-accuracy.directive';
import { ToggleBoxComponent } from './components/toggle-box/toggle-box.component';
import { SvmsModalComponent } from './components/svms-modal/svms-modal.component';
import { SvmsModalFooterComponent } from './components/svms-modal-footer/svms-modal-footer.component';
import { SvmsModalBodyComponent } from './components/svms-modal-body/svms-modal-body.component';
import { ContactCardComponent } from './components/contact-card/contact-card.component';
import { AddedValueComponent } from './components/added-value/added-value.component';
import { OnscrollDirective } from './directives/onscroll.directive';
import { RulesLogicComponent } from './components/rules-logic/rules-logic.component';
import { MandatePatternDirective } from './directives/mandate-pattern.directive';
import { SvmsDialogComponent } from './components/svms-dialog/svms-dialog.component';
import { SvmsDialogHeaderComponent } from './components/svms-dialog/svms-dialog-header/svms-dialog-header.component';
import { ColumnCustomOrderComponent } from './components/column-custom-order/column-custom-order.component';
import { QuickViewFlowComponent } from './components/quick-view-flow/quick-view-flow.component';
import { SvmsDialogBodyComponent } from './components/svms-dialog/svms-dialog-body/svms-dialog-body.component';
import { SvmsDialogFooterComponent } from './components/svms-dialog/svms-dialog-footer/svms-dialog-footer.component';
import { SwitchAccountDialogComponent } from './components/sidebar/switch-account-dialog/switch-account-dialog.component';
import { ImpersonateDialogComponent } from './components/sidebar/impersonate-dialog/impersonate-dialog.component';
import { RangeValidatorDirective } from './directives/range-validator.directive';
import { NgxStarRatingModule } from 'ngx-star-rating';
import { QuillUploaderComponent } from './components/quill-uploader/quill-uploader.component';
import { QuillModule } from 'ngx-quill';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

import { WorkerAssignmentsComponent } from './components/worker-assignments/worker-assignments.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { I18NextModule } from 'angular-i18next';
import { MasterDataComponent } from './components/master-data/master-data.component';
import { LocalStorageDataComponent } from './components/local-storage-data/local-storage-data.component';
import { SvgIconsModule } from '@ngneat/svg-icon';
import { SupportingTextComponent } from './components/supporting-text/supporting-text.component';
import { AlphabetOnlyDirective } from './directives/alphabet-only.directive';
import { RemoteWorkerFormComponent } from './components/remote-worker-form/remote-worker-form.component';
import { RemoteWorkerDetailsViewComponent } from './components/remote-worker-details-view/remote-worker-details-view.component';
import { ResizableElementDirective } from './directives/resizable-element.directive';
import { ViewOnboardingTasksComponent } from './components/view-onboarding-tasks/view-onboarding-tasks.component';
import { PreIdentifiedCandidateComponent } from './components/pre-identified-candidate/pre-identified-candidate.component';
import { CreateCandidateComponent } from './components/create-candidate/create-candidate.component';
import { AdjustmentAndTaxFormsComponent } from './components/adjustment-and-tax-forms/adjustment-and-tax-forms.component';
import { AdjustmentTaxDetailPageComponent } from './components/adjustment-tax-detail-page/adjustment-tax-detail-page.component';
import { CollapsibleTextComponent } from './components/collapsible-text/collapsible-text.component';
import { DuplicateCandidatesComponent } from './components/duplicate-candidates/duplicate-candidates.component';
import { AlertComponent } from './components/alert/alert.component';
import { HyperlinkDirective } from './directives/hyperlink.directive';
import { RateDetailsComponent } from './components/rate-details/rate-details.component';
import { MasterProfileLinkingComponent } from '../master-talent-profiles/master-profile-linking/master-profile-linking.component';
import { HrefParserDirective } from './directives/href-parser.directive';
import { S3AttachmentDownloadDirective } from './directives/s3-attachment-download.directive';
import { MasterTalentProfileDetailsComponent } from '../master-talent-profiles/master-talent-profile-details/master-talent-profile-details.component';
import { CandidateJobProfileComponent } from '../jobs/job-details/components/candidate-job-view/components/candidate-job-profile/candidate-job-profile.component';
import { LogListComponent } from '../library/logs/log-list/log-list.component';
import { DobCalendarComponent } from './dob-calendar/dob-calendar.component';
import { SvmsMinMaxPickerComponent } from './components/svms-min-max-picker/svms-min-max-picker.component';
import { CredentialingIframeComponent } from './credentialing-iframe/credentialing-iframe.component';
import { TaxAdjustmentService } from './service/utility/taxAdjustment.service';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

const declarables = [
  HeaderComponent,
  SidebarComponent,
  NotificationComponent,
  InputDateComponent,
  LangSwitcherComponent,
  ThemeSwitcherComponent,
  PasswordStrengthComponent,
  PasswordToggleDirective,
  PasswordStrengthComponent,
  DragAndDropDirective,
  AuthorizeDirective,
  AccessControlDirective,
  DebounceDirective,
  SvmsDatepickerComponent,
  ShortNamePipe,
  ChunkPipe,
  I18nDirective,
  SvmsSidebarComponent,
  SvmsSidebarBodyComponent,
  SvmsSidebarFooterComponent,
  SvmsSidebarExtendedComponent,
  SearchAddressComponent,
  TooltipDirective,
  ColumnCustomOrderComponent,
  QuickViewFlowComponent,
  FocusDirective,
  ResponsiveMenuDirective,
  BasicInfoComponent,
  HierarchyComponent,
  ModulesComponent,
  ProgramManageComponent,
  PermissionsComponent,
  AddressContactDetailsComponent,
  MasterProfileLinkingComponent,
  ResumeUploadComponent,
  HighlightDirective,
  ButtonLoaderComponent,
  RemovePrefixSuffixPipe,
  SnakeToTitleCasePipe,
  NoDataComponent,
  ToggleButtonComponent,
  CreateRoleComponent,
  StatusComponent,
  QuestionComponent,
  StatusMessageComponent,
  PopoverComponent,
  CalendarResponsiveDirective,
  AccountCodeGenerateComponent,
  AllowUptoNDigitDecimalNumberDirective,
  SafeHtmlPipe,
  SupportFlyoutComponent,
  AccuracyPipe,
  InputAccuracyDirective,
  OnscrollDirective,
  RulesLogicComponent,
  QuillUploaderComponent,
  SupportingTextComponent,
  AlphabetOnlyDirective,
  ResizableElementDirective,
  RateDetailsComponent,
  MasterTalentProfileDetailsComponent,
  CandidateJobProfileComponent,
  LogListComponent,
  SvmsMinMaxPickerComponent,
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsUploadAvatarModule,
    SvmsUploadProfileAvatarModule,
    TabsModule,
    ReactiveFormsModule,
    RouterModule,
    NewSharedModule,
    NgxSkeletonLoaderModule,
    PerfectScrollbarModule,
    NgbPopoverModule,
    DndModule,
    NgxQRCodeModule,
    TreeviewModule.forRoot(),
    NgbModule,
    NgxStarRatingModule,
    I18NextModule,
    QuillModule.forRoot(),
    NgxDocViewerModule,
    SvgIconsModule,
  ],
  exports: [
    ...declarables,
    HighlightDirective,
    TabsModule,
    SvmsUploadAvatarModule,
    SvmsUploadProfileAvatarModule,
    ProgramsComponent,
    OnlyNumberDirective,
    QuestionComponent,
    ProgramConfigurationComponent,
    ExpressionBuilderConditionComponent,
    RuleBuilderConditionComponent,
    ExpressionBuilderRecipientComponent,
    CommonViewRuleFlowComponent,
    CreatePreIdentifiedCandidateComponent,
    SvmsDragTableComponent,
    HierarchyTreeviewComponent,
    SortHelperPipe,
    PrecisionPipe,
    ConfigCommonListingComponent,
    ColumnCustomOrderComponent,
    QuickViewFlowComponent,
    ToggleBoxComponent,
    SvmsModalComponent,
    SvmsModalBodyComponent,
    SvmsModalFooterComponent,
    ContactCardComponent,
    AddedValueComponent,
    OnscrollDirective,
    UniqueKeyPipe,
    MandatePatternDirective,
    SvmsDialogComponent,
    SvmsDialogHeaderComponent,
    SvmsDialogBodyComponent,
    SvmsDialogFooterComponent,
    RangeValidatorDirective,
    NgxStarRatingModule,
    MasterDataComponent,
    RemoteWorkerFormComponent,
    RemoteWorkerDetailsViewComponent,
    ViewOnboardingTasksComponent,
    PreIdentifiedCandidateComponent,
    AdjustmentAndTaxFormsComponent,
    AdjustmentTaxDetailPageComponent,
    CollapsibleTextComponent,
    DuplicateCandidatesComponent,
    HyperlinkDirective,
    HrefParserDirective,
    S3AttachmentDownloadDirective,
    CredentialingIframeComponent,
    DobCalendarComponent,
  ],
  providers: [
    AddressService,
    TaxAdjustmentService,
    TranslationService,
    AwsS3FileUploadService,
    CurrencyService,
    ReasonCodesService,
    SnakeToTitleCasePipe,
    AccuracyPipe,
    DecimalPipe,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
  declarations: [
    ...declarables,
    FilterPipe,
    BasicInfoComponent,
    HierarchyComponent,
    PermissionsComponent,
    AddressContactDetailsComponent,
    ProgramsComponent,
    OnlyNumberDirective,
    NoDataComponent,
    ConfirmationReasonBoxComponent,
    StatusMessageComponent,
    ProgramConfigurationComponent,
    ExpressionBuilderConditionComponent,
    RuleBuilderConditionComponent,
    ExpressionBuilderRecipientComponent,
    CommonViewRuleFlowComponent,
    CreatePreIdentifiedCandidateComponent,
    UniqueKeyPipe,
    SvmsDragTableComponent,
    HierarchyTreeviewComponent,
    SortHelperPipe,
    QrScannerComponent,
    PrecisionPipe,
    ConfigCommonListingComponent,
    PrecisionPipe,
    ToggleBoxComponent,
    SvmsModalComponent,
    SvmsModalFooterComponent,
    SvmsModalBodyComponent,
    ContactCardComponent,
    AddedValueComponent,
    MandatePatternDirective,
    ImpersonateDialogComponent,
    SwitchAccountDialogComponent,
    SvmsDialogComponent,
    SvmsDialogHeaderComponent,
    SvmsDialogBodyComponent,
    SvmsDialogFooterComponent,
    RangeValidatorDirective,
    WorkerAssignmentsComponent,
    ConfirmationDialogComponent,
    QuillUploaderComponent,
    MasterDataComponent,
    LocalStorageDataComponent,
    SupportingTextComponent,
    RemoteWorkerFormComponent,
    RemoteWorkerDetailsViewComponent,
    ViewOnboardingTasksComponent,
    PreIdentifiedCandidateComponent,
    CreateCandidateComponent,
    AdjustmentAndTaxFormsComponent,
    AdjustmentTaxDetailPageComponent,
    CollapsibleTextComponent,
    DuplicateCandidatesComponent,
    AlertComponent,
    HyperlinkDirective,
    HrefParserDirective,
    S3AttachmentDownloadDirective,
    DobCalendarComponent,
    CredentialingIframeComponent,
  ],
})
export class SharedModule {}
