import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateFactorDetailsComponent } from './rate-factor-details.component';

describe('RateFactorDetailsComponent', () => {
  let component: RateFactorDetailsComponent;
  let fixture: ComponentFixture<RateFactorDetailsComponent>;
  CommonTestingModule.setUpTestBed(RateFactorDetailsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RateFactorDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RateFactorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
