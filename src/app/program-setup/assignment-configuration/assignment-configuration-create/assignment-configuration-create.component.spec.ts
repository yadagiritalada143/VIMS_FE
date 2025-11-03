import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentConfigurationCreateComponent } from './assignment-configuration-create.component';

describe('AssignmentConfigurationCreateComponent', () => {
  let component: AssignmentConfigurationCreateComponent;
  let fixture: ComponentFixture<AssignmentConfigurationCreateComponent>;
  CommonTestingModule.setUpTestBed(AssignmentConfigurationCreateComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentConfigurationCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentConfigurationCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
