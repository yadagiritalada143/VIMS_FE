import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TogglePanelComponent } from 'src/app/self-configuration/configs/program/master-data-types/master-data-details/toggle-panel/toggle-panel.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateFactorsDetailComponent } from './rate-factors-detail.component';

describe('RateFactorsDetailComponent', () => {
  let component: RateFactorsDetailComponent;
  let fixture: ComponentFixture<RateFactorsDetailComponent>;
  CommonTestingModule.setUpTestBed(RateFactorsDetailComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateFactorsDetailComponent,TogglePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateFactorsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
