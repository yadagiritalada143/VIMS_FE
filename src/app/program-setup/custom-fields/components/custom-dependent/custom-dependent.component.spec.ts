import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomDependentComponent } from './custom-dependent.component';

describe('CustomDependentComponent', () => {
  let component: CustomDependentComponent;
  let fixture: ComponentFixture<CustomDependentComponent>;
  CommonTestingModule.setUpTestBed(CustomDependentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomDependentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomDependentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
