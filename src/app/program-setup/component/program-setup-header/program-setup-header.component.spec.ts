import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramSetupHeaderComponent } from './program-setup-header.component';

describe('ProgramSetupHeaderComponent', () => {
  let component: ProgramSetupHeaderComponent;
  let fixture: ComponentFixture<ProgramSetupHeaderComponent>;
  CommonTestingModule.setUpTestBed(ProgramSetupHeaderComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramSetupHeaderComponent],
      imports: [],
      providers: [],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramSetupHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
