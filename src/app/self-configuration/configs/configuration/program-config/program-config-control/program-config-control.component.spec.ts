import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgramConfigControlComponent } from './program-config-control.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ProgramConfigInnerComponent', () => {
  let component: ProgramConfigControlComponent;
  let fixture: ComponentFixture<ProgramConfigControlComponent>;
  CommonTestingModule.setUpTestBed(ProgramConfigControlComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramConfigControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
