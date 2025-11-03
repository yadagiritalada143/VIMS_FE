import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { OfferDetailPanelComponent } from './offer-detail-panel.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
describe('OfferDetailPanelComponent', () => {
  let component: OfferDetailPanelComponent;
  let fixture: ComponentFixture<OfferDetailPanelComponent>;
  CommonTestingModule.setUpTestBed(OfferDetailPanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OfferDetailPanelComponent, SvmsDatepickerComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
