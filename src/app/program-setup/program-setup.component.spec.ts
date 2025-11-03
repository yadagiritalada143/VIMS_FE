import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramSetupComponent } from './program-setup.component';

describe('ProgramSetupComponent', () => {
  let component: ProgramSetupComponent;
  let fixture: ComponentFixture<ProgramSetupComponent>;
  CommonTestingModule.setUpTestBed(ProgramSetupComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramSetupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
