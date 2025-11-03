import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramSetupDetailsComponent } from './program-setup-details.component';

describe('ProgramSetupDetailsComponent', () => {
  let component: ProgramSetupDetailsComponent;
  let fixture: ComponentFixture<ProgramSetupDetailsComponent>;

  CommonTestingModule.setUpTestBed(ProgramSetupDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramSetupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
