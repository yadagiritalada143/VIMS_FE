import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateRateFactorListComponent } from './create-rate-factor-list.component';

describe('CreateRateFactorListComponent', () => {
  let component: CreateRateFactorListComponent;
  let fixture: ComponentFixture<CreateRateFactorListComponent>;
  CommonTestingModule.setUpTestBed(CreateRateFactorListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateRateFactorListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRateFactorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
