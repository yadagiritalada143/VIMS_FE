import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramSetupHomeComponent } from './program-setup-home.component';

describe('ProgramSetupHomeComponent', () => {
  let component: ProgramSetupHomeComponent;
  let fixture: ComponentFixture<ProgramSetupHomeComponent>;
  CommonTestingModule.setUpTestBed(ProgramSetupHomeComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramSetupHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramSetupHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
