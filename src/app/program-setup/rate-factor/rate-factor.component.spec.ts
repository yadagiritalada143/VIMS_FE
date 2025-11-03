import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateFactorComponent } from './rate-factor.component';

describe('RateFactorComponent', () => {
  let component: RateFactorComponent;
  let fixture: ComponentFixture<RateFactorComponent>;
  CommonTestingModule.setUpTestBed(RateFactorComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateFactorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateFactorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
