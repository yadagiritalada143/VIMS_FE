import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateFactorListComponent } from './rate-factor-list.component';

describe('RateFactorListComponent', () => {
  let component: RateFactorListComponent;
  let fixture: ComponentFixture<RateFactorListComponent>;
  CommonTestingModule.setUpTestBed(RateFactorListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateFactorListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateFactorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
