import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddDelegatesComponent } from './add-delegates.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';

describe('AddDelegatesComponent', () => {
  let component: AddDelegatesComponent;
  let fixture: ComponentFixture<AddDelegatesComponent>;
  CommonTestingModule.setUpTestBed(AddDelegatesComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDelegatesComponent, SvmsDatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDelegatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
